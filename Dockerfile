# Stage 1: Build cpg-gen from cpg-test-release source
FROM golang:1.25 AS cpg-builder

WORKDIR /build
COPY --from=cpg-source *.go go.mod go.sum ./
RUN go build -o cpg-gen ./

# Stage 2: Generate CPG database
FROM golang:1.25 AS cpg-generator

WORKDIR /gen
COPY --from=cpg-builder /build/cpg-gen .

# Clone all 4 modules at pinned commits (matching cpg-test-release submodules)
RUN git clone https://github.com/prometheus/prometheus.git && \
    cd prometheus && git checkout 8937cbd3955513efe0e0c76c58a3e0665a35df3a && cd .. && \
    git clone https://github.com/prometheus/client_golang.git && \
    cd client_golang && git checkout bf37be4fecc0a3d89f980252e206b67806990e56 && cd .. && \
    git clone https://github.com/kubernetes-sigs/prometheus-adapter.git && \
    cd prometheus-adapter && git checkout 01919d0ef11859bc214e0c8a8bd5368afd9d47f7 && cd .. && \
    git clone --depth 1 https://github.com/prometheus/alertmanager.git

# cpg-gen's findSubModules discovers ALL nested go.mod files and adds them to a
# Go workspace. If two directories declare the same module path, Go fails with
# "module X appears multiple times in workspace". Fix: find duplicates and keep
# only the first occurrence of each module path.
RUN find . -name go.mod -not -path './.git/*' -not -path '*/vendor/*' | \
    while read f; do \
      mod=$(head -5 "$f" | grep '^module ' | awk '{print $2}'); \
      echo "$mod $f"; \
    done | sort | awk '{ if (seen[$1]++) print $2 }' | xargs -r rm -v

RUN mkdir -p /data && \
    ./cpg-gen -verbose \
      -modules "./client_golang:github.com/prometheus/client_golang:client_golang,./prometheus-adapter:sigs.k8s.io/prometheus-adapter:adapter,./alertmanager:github.com/prometheus/alertmanager:alertmanager" \
      ./prometheus /data/cpg.db

# Stage 3: Build frontend and backend
FROM node:20-slim AS app-builder

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY apps/backend/package.json apps/backend/tsconfig.json ./apps/backend/
COPY apps/frontend/package.json apps/frontend/tsconfig.json apps/frontend/tsconfig.node.json ./apps/frontend/

RUN npm ci

# Copy source files
COPY packages/ ./packages/
COPY apps/ ./apps/

# Build all packages
RUN npx turbo build

# Stage 4: Production runtime
FROM node:20-slim

WORKDIR /app

# Copy the generated CPG database
COPY --from=cpg-generator /data/cpg.db /data/cpg.db

# Copy backend build output and dependencies
COPY --from=app-builder /app/apps/backend/dist ./dist
COPY --from=app-builder /app/apps/backend/package.json ./
COPY --from=app-builder /app/node_modules ./node_modules
COPY --from=app-builder /app/packages/shared/dist ./node_modules/@cpg-explorer/shared/dist
COPY --from=app-builder /app/packages/shared/package.json ./node_modules/@cpg-explorer/shared/

# Copy frontend build output (served as static files)
COPY --from=app-builder /app/apps/frontend/dist ./frontend/dist

ENV NODE_ENV=production
ENV PORT=3001
ENV CPG_DB_PATH=/data/cpg.db

EXPOSE 3001

CMD ["node", "dist/index.js"]
