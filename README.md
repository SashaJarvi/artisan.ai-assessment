# CPG Explorer

An in-browser IDE for exploring Go codebases through their Code Property Graph (CPG). Built for the Prometheus ecosystem — Prometheus, client_golang, prometheus-adapter, and alertmanager.

## Prerequisites

The `cpg-test-release` directory (containing the CPG generator source) must be placed alongside this project:

```
parent/
  cpg-test-release/     # CPG generator source (Go)
  artisan.ai-assessment/ # This project
```

## Quick Start

```bash
docker compose up --build
```

Open [http://localhost:3001](http://localhost:3001).

The first run builds the CPG generator, clones all 4 Go modules, and generates the database (~10-30 min). Subsequent runs reuse the cached image layers.

## Features

### Dashboard
Overview of the entire codebase: KPI cards (packages, functions, LOC, complexity), complexity distribution histogram, findings summary, and hotspot function table with clickable navigation.

### Package Architecture Map
Interactive force-directed graph of ~170+ packages with ~400+ dependency edges. Nodes sized by complexity, colored by module. Click any package to see its functions in a detail sidebar.

### Call Graph Explorer
Search for any function, then explore its call tree as an interactive hierarchical graph. Adjust depth (1-5), toggle between callees and callers. Select a node to view its source code in the integrated CodeMirror editor.

## Architecture

**Turborepo monorepo** with three packages:

| Package           | Description                                               |
|-------------------|-----------------------------------------------------------|
| `packages/shared` | TypeScript interfaces shared between frontend and backend |
| `apps/backend`    | Node.js + Express + better-sqlite3 REST API               |
| `apps/frontend`   | Vue 3 + Vite + Tailwind CSS SPA                           |

### Tech Stack

- **Frontend:** Vue 3, TypeScript, Vite, Tailwind CSS, Pinia, Vue Router, VueUse
- **Graph Visualization:** Cytoscape.js with cola (force-directed) and dagre (hierarchical) layouts
- **Code Viewer:** CodeMirror 6 with Go syntax highlighting and line decoration support
- **Charts:** Chart.js via vue-chartjs
- **Backend:** Express, better-sqlite3 (read-only mode with 64MB cache + 256MB mmap)
- **Build:** Turborepo with npm workspaces
- **Deploy:** Docker multi-stage build (cpg-gen + app build + runtime in one Dockerfile)

### Design

Vue DevTools-inspired dark theme with:
- Icon-based sidebar navigation
- Command-palette style global search
- Resizable split panels
- Skeleton loading states
- Monospace font for code and identifiers

## Design Decisions & Trade-offs

### Why better-sqlite3 over an ORM?
The CPG database is read-only and comes with 30 pre-built SQL queries. `better-sqlite3` gives synchronous, zero-overhead access with prepared statements — no async callback complexity needed for reads. The database's `queries` table is loaded into a registry at startup.

### Why Cytoscape.js over D3?
Cytoscape is purpose-built for graph analysis with layout algorithms (cola, dagre, cose), built-in event system, and performant rendering up to ~500 elements. D3 would require implementing all graph layout and interaction logic manually.

### Why server-side graph limits?
With ~555K nodes and ~1.5M edges, sending the full graph would crash the browser. Every graph endpoint enforces a `max_nodes` parameter (default 60, max 200). BFS/DFS traversals are depth-limited. The frontend shows a "truncated" indicator when limits are hit.

### Why CodeMirror 6 over Monaco?
CodeMirror 6 is significantly lighter (~300KB vs ~2MB), supports Go syntax highlighting, and has a clean line decoration API. Read-only mode is a first-class citizen.

### Why a single multi-stage Dockerfile?
Everything — CPG generation, app build, and runtime — is in one Dockerfile with 4 stages. The Express backend serves the Vue SPA as static files, eliminating nginx/reverse proxy. Docker layer caching means the expensive CPG generation (~10-30 min) only runs once; subsequent builds reuse the cached database layer.

## Development

```bash
npm install
npm run dev      # Starts backend (port 3001) and frontend (port 5173) concurrently
```

Frontend dev server proxies `/api/*` to the backend.

### Local Development Prerequisites

- Node.js 20+
- A generated `cpg.db` file in `./data/` (or set `CPG_DB_PATH` env var)
- `cpg-test-release` directory alongside this project (for Docker builds)

## Project Structure

```
cpg-explorer/
  docker-compose.yml          # Single service with additional_contexts for cpg-test-release
  Dockerfile                  # Multi-stage: cpg-gen build → DB generation → app build → runtime
  packages/shared/            # Shared TypeScript types
  apps/backend/               # Express REST API
  apps/frontend/              # Vue 3 SPA
```

## API Endpoints

| Endpoint                            | Description                                                     |
|-------------------------------------|-----------------------------------------------------------------|
| `GET /api/dashboard/*`              | Pre-computed dashboard data (overview, distributions, hotspots) |
| `GET /api/packages/graph`           | Package dependency graph for architecture visualization         |
| `GET /api/packages/:name/functions` | Functions in a package                                          |
| `GET /api/graph/call-chain`         | BFS call graph from a function                                  |
| `GET /api/graph/callers`            | Transitive callers of a function                                |
| `GET /api/graph/neighborhood`       | N-hop neighborhood of a node                                    |
| `GET /api/graph/cfg`                | Control flow graph of a function                                |
| `GET /api/source`                   | Source file content                                             |
| `GET /api/search/symbol`            | Symbol search with LIKE matching                                |
| `GET /api/search/xref`              | Cross-references for a symbol                                   |
