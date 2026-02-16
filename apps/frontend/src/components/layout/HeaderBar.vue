<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SymbolSearch from '../search/SymbolSearch.vue'

const route = useRoute()

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/': 'Dashboard',
    '/packages': 'Package Architecture',
    '/call-graph': 'Call Graph Explorer'
  }
  return titles[route.path] ?? 'CPG Explorer'
})
</script>

<template>
  <header class="flex items-center h-12 px-4 border-b border-surface-border bg-surface-darker shrink-0">
    <h1 class="text-sm font-medium text-gray-300 w-48 shrink-0">
      {{ pageTitle }}
    </h1>

    <div class="flex-1 flex justify-center max-w-xl mx-auto">
      <SymbolSearch />
    </div>

    <div class="w-48 shrink-0 flex justify-end">
      <span class="text-xs text-gray-500 font-mono">CPG Explorer</span>
    </div>
  </header>
</template>
