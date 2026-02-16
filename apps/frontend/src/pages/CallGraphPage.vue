<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGraphStore } from '@/stores/graph';
import { useSourceStore } from '@/stores/source';
import { fetchApi } from '@/api/client';
import CytoscapeCanvas from '@/components/graph/CytoscapeCanvas.vue';
import GraphToolbar from '@/components/graph/GraphToolbar.vue';
import SplitPanel from '@/components/layout/SplitPanel.vue';
import CodeViewer from '@/components/code/CodeViewer.vue';
import type { ISymbolResult } from '@cpg-explorer/shared';

const route = useRoute();
const router = useRouter();
const graphStore = useGraphStore();
const sourceStore = useSourceStore();

const canvasRef = ref<InstanceType<typeof CytoscapeCanvas> | null>(null);
const depth = ref(3);
const direction = ref<'callees' | 'callers' | 'both'>('callees');
const searchQuery = ref('');
const searchResults = ref<ISymbolResult[]>([]);
const isSearching = ref(false);
const selectedFunctionName = ref('');
const selectedNodeInfo = ref<Record<string, unknown> | null>(null);

const currentFunctionId = computed(() => (route.query.fn as string) || '');

onMounted(() => {
  if (currentFunctionId.value) {
    loadGraph(currentFunctionId.value);
  }
});

watch(() => route.query.fn, (fn) => {
  if (fn) loadGraph(fn as string);
});

const loadGraph = async (functionId: string) => {
  if (direction.value === 'callers') {
    await graphStore.fetchCallers(functionId, depth.value);
  } else {
    await graphStore.fetchCallChain(functionId, depth.value);
  }

  const node = graphStore.nodes.find((n) => n.data.id === functionId);
  if (node) {
    selectedFunctionName.value = node.data.label;
  }
};

const handleNodeTap = async (id: string) => {
  graphStore.selectNode(id);
  const node = graphStore.nodes.find((n) => n.data.id === id);
  if (node?.data.file) {
    await sourceStore.fetchFile(node.data.file);
    if (node.data.line) {
      sourceStore.goToLine(node.data.line);
    }
  }
  selectedNodeInfo.value = node?.data ?? null;
  canvasRef.value?.highlightNode(id);
};

const handleNodeDblClick = (id: string) => {
  router.push({ name: 'call-graph', query: { fn: id } });
};

const handleBackgroundTap = () => {
  graphStore.selectNode(null);
  selectedNodeInfo.value = null;
};

const handleDepthChange = (newDepth: number) => {
  depth.value = newDepth;
  if (currentFunctionId.value) {
    loadGraph(currentFunctionId.value);
  }
};

const handleDirectionChange = (dir: 'callees' | 'callers' | 'both') => {
  direction.value = dir;
  if (currentFunctionId.value) {
    loadGraph(currentFunctionId.value);
  }
};

const handleSearch = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = [];
    return;
  }
  isSearching.value = true;
  try {
    const res = await fetchApi<{ data: ISymbolResult[] }>('/search/symbol', {
      q: searchQuery.value,
      kind: 'function',
      limit: 10,
    });
    searchResults.value = res.data;
  } catch {
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
};

const selectSearchResult = (result: ISymbolResult) => {
  router.push({ name: 'call-graph', query: { fn: result.id } });
  searchQuery.value = '';
  searchResults.value = [];
};

const handleLayoutChange = (layout: string) => {
  canvasRef.value?.runLayout(layout);
};

const handleExportPng = () => {
  const png = canvasRef.value?.exportPng();
  if (png) {
    const a = document.createElement('a');
    a.href = png;
    a.download = 'call-graph.png';
    a.click();
  }
};
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Controls bar -->
    <div class="flex items-center gap-3 px-4 py-2 border-b border-surface-border bg-surface-darker text-xs">
      <!-- Search -->
      <div class="relative w-64">
        <input
          v-model="searchQuery"
          placeholder="Search functions..."
          class="w-full bg-surface-light border border-surface-border rounded-md px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent/50"
          @input="handleSearch"
        />
        <div
          v-if="searchResults.length > 0"
          class="absolute top-full mt-1 w-full bg-surface border border-surface-border rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto"
        >
          <button
            v-for="r in searchResults"
            :key="r.id"
            class="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors"
            @click="selectSearchResult(r)"
          >
            <span class="block text-sm font-mono text-gray-200 truncate">{{ r.name }}</span>
            <span class="block text-xs text-gray-500">{{ r.package }}</span>
          </button>
        </div>
      </div>

      <div class="h-4 w-px bg-surface-border" />

      <!-- Depth -->
      <span class="text-gray-500">Depth:</span>
      <div class="flex gap-1">
        <button
          v-for="d in [1, 2, 3, 4, 5]"
          :key="d"
          class="w-6 h-6 rounded text-center transition-colors"
          :class="[depth === d ? 'bg-accent/20 text-accent' : 'text-gray-500 hover:text-gray-300']"
          @click="handleDepthChange(d)"
        >
          {{ d }}
        </button>
      </div>

      <div class="h-4 w-px bg-surface-border" />

      <!-- Direction -->
      <div class="flex gap-1 bg-surface rounded-md p-0.5">
        <button
          class="px-2 py-1 rounded transition-colors"
          :class="[direction === 'callees' ? 'bg-accent/20 text-accent' : 'text-gray-500 hover:text-gray-300']"
          @click="handleDirectionChange('callees')"
        >
          Callees
        </button>
        <button
          class="px-2 py-1 rounded transition-colors"
          :class="[direction === 'callers' ? 'bg-accent/20 text-accent' : 'text-gray-500 hover:text-gray-300']"
          @click="handleDirectionChange('callers')"
        >
          Callers
        </button>
      </div>

      <div class="flex-1" />

      <span v-if="selectedFunctionName" class="text-gray-400 font-mono">
        {{ selectedFunctionName }}
      </span>
    </div>

    <!-- Main content: graph + code -->
    <div class="flex-1 min-h-0">
      <SplitPanel direction="horizontal" :initial-ratio="0.6">
        <template #first>
          <div class="flex flex-col h-full">
            <GraphToolbar
              :current-layout="canvasRef?.currentLayout ?? 'dagre'"
              :total-nodes="graphStore.totalNodes"
              :total-edges="graphStore.totalEdges"
              :is-truncated="graphStore.isTruncated"
              :is-layout-running="canvasRef?.isLayoutRunning ?? false"
              @layout-change="handleLayoutChange"
              @fit-to-view="canvasRef?.fitToView()"
              @zoom-in="canvasRef?.zoomIn()"
              @zoom-out="canvasRef?.zoomOut()"
              @export-png="handleExportPng"
            />
            <div class="flex-1">
              <CytoscapeCanvas
                ref="canvasRef"
                :nodes="graphStore.nodes"
                :edges="graphStore.edges"
                :is-loading="graphStore.isLoading"
                layout="dagre"
                @node-tap="handleNodeTap"
                @node-dbl-click="handleNodeDblClick"
                @background-tap="handleBackgroundTap"
              />
            </div>
          </div>
        </template>

        <template #second>
          <div class="flex flex-col h-full">
            <!-- Node info -->
            <div v-if="selectedNodeInfo" class="px-3 py-2 border-b border-surface-border bg-surface-darker text-xs space-y-1">
              <div class="flex items-center gap-2">
                <span class="tag-function">{{ (selectedNodeInfo as any).kind }}</span>
                <span class="font-mono text-gray-200">{{ (selectedNodeInfo as any).label }}</span>
              </div>
              <div class="text-gray-500">
                {{ (selectedNodeInfo as any).package }}
              </div>
            </div>

            <CodeViewer
              :code="sourceStore.content"
              :file="sourceStore.currentFile ?? ''"
              :scroll-to="sourceStore.scrollToLine"
              :is-loading="sourceStore.isLoading"
            />
          </div>
        </template>
      </SplitPanel>
    </div>
  </div>
</template>

