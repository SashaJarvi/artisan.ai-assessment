<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useCytoscape, type CytoscapeOptions } from '@/composables/use-cytoscape';
import type { ICytoscapeNode, ICytoscapeEdge } from '@cpg-explorer/shared';

interface Props {
  nodes: ICytoscapeNode[];
  edges: ICytoscapeEdge[];
  layout?: string;
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'cola',
  isLoading: false,
});

const emit = defineEmits<{
  nodeTap: [id: string];
  nodeDblClick: [id: string];
  backgroundTap: [];
}>();

const containerRef = ref<HTMLElement | null>(null);

const cytoscapeOptions: CytoscapeOptions = {
  layout: props.layout,
  onNodeTap: (id) => emit('nodeTap', id),
  onNodeDblClick: (id) => emit('nodeDblClick', id),
  onBackgroundTap: () => emit('backgroundTap'),
};

const { setElements, runLayout, fitToView, zoomIn, zoomOut, highlightNode, exportPng, currentLayout, isLayoutRunning } =
  useCytoscape(containerRef, cytoscapeOptions);

const showOverlay = computed(() => props.isLoading || isLayoutRunning.value);
const overlayText = computed(() => props.isLoading ? 'Loading data...' : 'Computing layout...');

watch(
  () => [props.nodes, props.edges],
  () => {
    if (props.nodes.length > 0) {
      setElements(props.nodes, props.edges);
    }
  },
  { deep: true },
);

watch(
  () => props.layout,
  (layout) => {
    if (layout) runLayout(layout);
  },
);

defineExpose({ runLayout, fitToView, zoomIn, zoomOut, highlightNode, exportPng, currentLayout, isLayoutRunning });
</script>

<template>
  <div class="relative w-full h-full">
    <div ref="containerRef" class="w-full h-full" />

    <!-- Loading overlay -->
    <div
      v-if="showOverlay"
      class="absolute inset-0 bg-surface-dark/80 flex items-center justify-center z-10"
    >
      <div class="flex flex-col items-center gap-2">
        <div class="w-8 h-8 border-2 border-gray-600 border-t-accent rounded-full animate-spin" />
        <span class="text-sm text-gray-400">{{ overlayText }}</span>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-if="!isLoading && nodes.length === 0"
      class="absolute inset-0 flex items-center justify-center"
    >
      <div class="text-center text-gray-500">
        <svg class="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p class="text-sm">No graph data to display</p>
        <p class="text-xs mt-1">Search for a symbol to begin exploring</p>
      </div>
    </div>
  </div>
</template>
