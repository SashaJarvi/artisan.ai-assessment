<script setup lang="ts">
import { ref, watch } from 'vue';
import { useCodemirror } from '@/composables/useCodemirror';

interface Props {
  code: string;
  highlightedLines?: number[];
  scrollTo?: number | null;
  file?: string;
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  code: '',
  highlightedLines: () => [],
  scrollTo: null,
  file: '',
  isLoading: false,
});

const containerRef = ref<HTMLElement | null>(null);
const { setContent, highlightLines, scrollToLine, clearHighlights } = useCodemirror(containerRef);

watch(() => props.code, (code) => {
  setContent(code);
});

watch(() => props.highlightedLines, (lines) => {
  if (lines && lines.length > 0) {
    highlightLines(lines);
  } else {
    clearHighlights();
  }
});

watch(() => props.scrollTo, (line) => {
  if (line) scrollToLine(line);
});
</script>

<template>
  <div class="relative h-full flex flex-col">
    <!-- File header -->
    <div v-if="file" class="px-3 py-2 text-xs text-gray-500 border-b border-surface-border bg-surface-darker font-mono truncate">
      {{ file }}
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center bg-surface-dark">
      <div class="w-6 h-6 border-2 border-gray-600 border-t-accent rounded-full animate-spin" />
    </div>

    <!-- Editor -->
    <div v-show="!isLoading" ref="containerRef" class="flex-1 overflow-hidden" />

    <!-- Empty state -->
    <div
      v-if="!isLoading && !code"
      class="absolute inset-0 flex items-center justify-center bg-surface-dark"
    >
      <div class="text-center text-gray-500 text-sm">
        <p>Select a node to view source code</p>
      </div>
    </div>
  </div>
</template>
