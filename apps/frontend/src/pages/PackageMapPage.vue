<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGraphStore } from '@/stores/graph';
import { fetchApi } from '@/api/client';
import CytoscapeCanvas from '@/components/graph/CytoscapeCanvas.vue';
import GraphToolbar from '@/components/graph/GraphToolbar.vue';
import type { IFunctionDetail } from '@cpg-explorer/shared';

const graphStore = useGraphStore();
const router = useRouter();

const canvasRef = ref<InstanceType<typeof CytoscapeCanvas> | null>(null);
const selectedPackage = ref<string | null>(null);
const packageFunctions = ref<IFunctionDetail[]>([]);
const isSidebarLoading = ref(false);

// Track navigation: null = module overview, string = viewing a specific module's packages
const currentModule = ref<string | null>(null);
const isModuleView = computed(() => currentModule.value === null);

onMounted(() => {
  graphStore.fetchModuleGraph();
});

const handleNodeTap = async (id: string) => {
  graphStore.selectNode(id);

  if (isModuleView.value) {
    // Tapping a module node — drill into its packages
    currentModule.value = id;
    await graphStore.fetchPackageGraph(id);
  } else {
    // Tapping a package node — show function sidebar
    selectedPackage.value = id;
    isSidebarLoading.value = true;
    try {
      const res = await fetchApi<{ data: IFunctionDetail[] }>(`/packages/${encodeURIComponent(id)}/functions`);
      packageFunctions.value = res.data;
    } catch {
      packageFunctions.value = [];
    } finally {
      isSidebarLoading.value = false;
    }
  }
};

const handleNodeDblClick = (id: string) => {
  handleNodeTap(id);
};

const handleBackgroundTap = () => {
  graphStore.selectNode(null);
  selectedPackage.value = null;
  packageFunctions.value = [];
};

const handleBack = () => {
  currentModule.value = null;
  selectedPackage.value = null;
  packageFunctions.value = [];
  graphStore.fetchModuleGraph();
};

const navigateToFunction = (functionId: string) => {
  router.push({ name: 'call-graph', query: { fn: functionId } });
};

const handleLayoutChange = (layout: string) => {
  canvasRef.value?.runLayout(layout);
};

const handleExportPng = () => {
  const png = canvasRef.value?.exportPng();
  if (png) {
    const a = document.createElement('a');
    a.href = png;
    a.download = 'package-map.png';
    a.click();
  }
};
</script>

<template>
  <div class="flex h-full">
    <!-- Main graph area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Back button + breadcrumb -->
      <div
        v-if="!isModuleView"
        class="flex items-center gap-2 px-3 py-1.5 border-b border-surface-border bg-surface-darker text-xs"
      >
        <button
          class="flex items-center gap-1 text-gray-400 hover:text-accent transition-colors cursor-pointer"
          @click="handleBack"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Modules
        </button>
        <span class="text-gray-600">/</span>
        <span class="text-gray-300 font-mono">{{ currentModule }}</span>
      </div>

      <GraphToolbar
        :current-layout="canvasRef?.currentLayout ?? 'cola'"
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
          layout="cola"
          @node-tap="handleNodeTap"
          @node-dbl-click="handleNodeDblClick"
          @background-tap="handleBackgroundTap"
        />
      </div>
    </div>

    <!-- Sidebar panel (only in package view) -->
    <div
      v-if="selectedPackage && !isModuleView"
      class="w-80 border-l border-surface-border bg-surface-darker overflow-y-auto shrink-0"
    >
      <div class="p-4 border-b border-surface-border">
        <h3 class="text-sm font-medium text-gray-200 truncate">{{ selectedPackage }}</h3>
        <p class="text-xs text-gray-500 mt-1">
          {{ packageFunctions.length }} functions
        </p>
      </div>

      <!-- Loading state -->
      <div v-if="isSidebarLoading" class="p-4 space-y-3">
        <div v-for="i in 5" :key="i" class="animate-pulse">
          <div class="h-3 bg-white/5 rounded w-3/4 mb-1" />
          <div class="h-2 bg-white/5 rounded w-1/2" />
        </div>
      </div>

      <!-- Function list -->
      <div v-else class="divide-y divide-surface-border">
        <button
          v-for="fn in packageFunctions"
          :key="fn.functionId"
          class="w-full text-left px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer"
          @click="navigateToFunction(fn.functionId)"
        >
          <span class="block text-sm font-mono text-accent truncate">{{ fn.name }}</span>
          <span class="flex gap-3 mt-1 text-xs text-gray-500">
            <span>CC: {{ fn.complexity }}</span>
            <span>LOC: {{ fn.loc }}</span>
            <span>In: {{ fn.fanIn }}</span>
            <span>Out: {{ fn.fanOut }}</span>
          </span>
        </button>
      </div>

      <div v-if="!isSidebarLoading && packageFunctions.length === 0" class="p-4 text-center text-sm text-gray-500">
        No functions in this package
      </div>
    </div>
  </div>
</template>
