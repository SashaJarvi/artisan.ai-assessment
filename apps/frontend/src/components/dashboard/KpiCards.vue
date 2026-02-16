<script setup lang="ts">
import { computed } from 'vue';
import { useDashboardStore } from '@/stores/dashboard';

const store = useDashboardStore();

const kpis = computed(() => [
  { label: 'Packages', value: store.getKpi('total_packages'), icon: 'pkg' },
  { label: 'Functions', value: store.getKpi('total_functions'), icon: 'fn' },
  { label: 'Total LOC', value: formatNumber(store.getKpi('total_loc')), icon: 'loc' },
  { label: 'Avg Complexity', value: store.getKpi('avg_complexity'), icon: 'cx' },
  { label: 'Nodes', value: formatNumber(store.getKpi('total_nodes')), icon: 'node' },
  { label: 'Edges', value: formatNumber(store.getKpi('total_edges')), icon: 'edge' },
  { label: 'Findings', value: store.getKpi('total_findings'), icon: 'find' },
  { label: 'Call Edges', value: formatNumber(store.getKpi('total_call_edges')), icon: 'call' },
]);

function formatNumber(val: string): string {
  const num = Number(val);
  if (isNaN(num)) return val;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return val;
}
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
    <div v-for="kpi in kpis" :key="kpi.label" class="panel p-4">
      <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">{{ kpi.label }}</div>
      <div class="text-xl font-semibold text-gray-100 font-mono">{{ kpi.value }}</div>
    </div>
  </div>
</template>
