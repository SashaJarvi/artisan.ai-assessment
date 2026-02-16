<script setup lang="ts">

interface Props {
  currentLayout: string;
  totalNodes?: number;
  totalEdges?: number;
  isTruncated?: boolean;
  isLayoutRunning?: boolean;
}

const props = withDefaults(defineProps<Props>(), { isLayoutRunning: false });

const emit = defineEmits<{
  layoutChange: [layout: string];
  fitToView: [];
  zoomIn: [];
  zoomOut: [];
  exportPng: [];
}>();

const layouts = [
  { value: 'cola', label: 'Force' },
  { value: 'dagre', label: 'Tree' },
  { value: 'cose', label: 'CoSE' },
  { value: 'circle', label: 'Circle' },
];
</script>

<template>
  <div class="flex items-center gap-2 px-3 py-2 border-b border-surface-border bg-surface-darker text-xs">
    <!-- Layout switcher -->
    <div class="flex items-center gap-1 bg-surface rounded-md p-0.5">
      <button
        v-for="layout in layouts"
        :key="layout.value"
        class="px-2 py-1 rounded transition-colors"
        :class="[
          currentLayout === layout.value
            ? 'bg-accent/20 text-accent'
            : 'text-gray-500 hover:text-gray-300',
          props.isLayoutRunning ? 'opacity-50 pointer-events-none' : ''
        ]"
        :disabled="props.isLayoutRunning"
        @click="emit('layoutChange', layout.value)"
      >
        {{ layout.label }}
      </button>
    </div>

    <div class="h-4 w-px bg-surface-border" />

    <!-- Zoom controls -->
    <button class="btn-ghost p-1" title="Zoom in" @click="emit('zoomIn')">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m6-6H6" />
      </svg>
    </button>
    <button class="btn-ghost p-1" title="Zoom out" @click="emit('zoomOut')">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6" />
      </svg>
    </button>
    <button class="btn-ghost p-1" title="Fit to view" @click="emit('fitToView')">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
      </svg>
    </button>

    <div class="flex-1" />

    <!-- Stats -->
    <span class="text-gray-500">
      {{ totalNodes ?? 0 }} nodes &middot; {{ totalEdges ?? 0 }} edges
    </span>
    <span v-if="isTruncated" class="text-amber-400">(truncated)</span>

    <!-- Export -->
    <button class="btn-ghost p-1" title="Export PNG" @click="emit('exportPng')">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    </button>
  </div>
</template>
