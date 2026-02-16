<script setup lang="ts">
import { useDashboardStore } from '@/stores/dashboard'

const store = useDashboardStore()

const emit = defineEmits<{
  navigate: [functionId: string];
}>()
</script>

<template>
  <div class="panel">
    <div class="panel-header">
      Hotspot Functions
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs text-gray-500 uppercase tracking-wider">
            <th class="px-4 py-2">
              Function
            </th>
            <th class="px-4 py-2">
              Package
            </th>
            <th class="px-4 py-2 text-right">
              Complexity
            </th>
            <th class="px-4 py-2 text-right">
              LOC
            </th>
            <th class="px-4 py-2 text-right">
              Fan In
            </th>
            <th class="px-4 py-2 text-right">
              Fan Out
            </th>
            <th class="px-4 py-2 text-right">
              Findings
            </th>
            <th class="px-4 py-2 text-right">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="fn in store.hotspots"
            :key="fn.functionId"
            class="border-t border-surface-border hover:bg-white/[0.02] cursor-pointer transition-colors"
            @click="emit('navigate', fn.functionId)"
          >
            <td class="px-4 py-2 font-mono text-accent truncate max-w-[200px]">
              {{ fn.name }}
            </td>
            <td class="px-4 py-2 text-gray-400 truncate max-w-[200px]">
              {{ fn.package }}
            </td>
            <td class="px-4 py-2 text-right font-mono">
              {{ fn.complexity }}
            </td>
            <td class="px-4 py-2 text-right font-mono">
              {{ fn.loc }}
            </td>
            <td class="px-4 py-2 text-right font-mono">
              {{ fn.fanIn }}
            </td>
            <td class="px-4 py-2 text-right font-mono">
              {{ fn.fanOut }}
            </td>
            <td class="px-4 py-2 text-right font-mono">
              {{ fn.findingCount }}
            </td>
            <td class="px-4 py-2 text-right font-mono text-amber-400">
              {{ fn.hotspotScore.toFixed(1) }}
            </td>
          </tr>
        </tbody>
      </table>
      <div
        v-if="store.hotspots.length === 0"
        class="p-8 text-center text-gray-500 text-sm"
      >
        No hotspot data available
      </div>
    </div>
  </div>
</template>
