<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ISymbolResult } from '@cpg-explorer/shared'
import { onClickOutside, useDebounceFn } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { fetchApi } from '@/api/client'

const router = useRouter()
const query = ref('')
const results = ref<ISymbolResult[]>([])
const isOpen = ref(false)
const isLoading = ref(false)
const containerRef = ref<HTMLElement | null>(null)

onClickOutside(containerRef, () => {
  isOpen.value = false
})

const doSearch = useDebounceFn(async (q: string) => {
  if (q.length < 2) {
    results.value = []
    return
  }
  isLoading.value = true
  try {
    const res = await fetchApi<{ data: ISymbolResult[] }>('/search/symbol', { q, limit: 15 })
    results.value = res.data
    isOpen.value = true
  } catch {
    results.value = []
  } finally {
    isLoading.value = false
  }
}, 300)

watch(query, val => doSearch(val))

const selectResult = (result: ISymbolResult) => {
  isOpen.value = false
  query.value = ''
  results.value = []

  if (result.kind === 'function') {
    router.push({ name: 'call-graph', query: { fn: result.id } })
  } else if (result.kind === 'package') {
    router.push({ name: 'packages', query: { pkg: result.name } })
  } else {
    router.push({ name: 'call-graph', query: { fn: result.id } })
  }
}

const kindColor = (kind: string): string => {
  const colors: Record<string, string> = {
    function: 'text-blue-400',
    type_decl: 'text-amber-400',
    package: 'text-purple-400',
    parameter: 'text-green-400',
    local: 'text-gray-400'
  }
  return colors[kind] ?? 'text-gray-400'
}
</script>

<template>
  <div
    ref="containerRef"
    class="relative w-full max-w-md"
  >
    <div class="relative">
      <svg
        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        v-model="query"
        type="text"
        placeholder="Search symbols... (functions, types, packages)"
        class="w-full bg-surface-light border border-surface-border rounded-md pl-9 pr-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
        @focus="isOpen = results.length > 0"
      >
      <div
        v-if="isLoading"
        class="absolute right-3 top-1/2 -translate-y-1/2"
      >
        <div class="w-4 h-4 border-2 border-gray-500 border-t-accent rounded-full animate-spin" />
      </div>
    </div>

    <div
      v-if="isOpen && results.length > 0"
      class="absolute top-full mt-1 w-full bg-surface border border-surface-border rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto"
    >
      <button
        v-for="result in results"
        :key="result.id"
        class="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 text-left transition-colors cursor-pointer"
        @click="selectResult(result)"
      >
        <span
          class="text-xs font-mono shrink-0 w-16"
          :class="kindColor(result.kind)"
        >
          {{ result.kind }}
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-mono text-gray-200 truncate">
            {{ result.name }}
          </span>
          <span class="block text-xs text-gray-500 truncate">
            {{ result.package }} &middot; {{ result.file }}:{{ result.line }}
          </span>
        </span>
      </button>
    </div>

    <div
      v-if="isOpen && query.length >= 2 && results.length === 0 && !isLoading"
      class="absolute top-full mt-1 w-full bg-surface border border-surface-border rounded-lg shadow-xl z-50 p-4 text-center text-sm text-gray-500"
    >
      No symbols found for "{{ query }}"
    </div>
  </div>
</template>
