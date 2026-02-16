<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
} from 'chart.js';
import { useDashboardStore } from '@/stores/dashboard';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

const store = useDashboardStore();

const chartData = computed(() => ({
  labels: store.complexityDistribution.map((b) => b.bucket),
  datasets: [
    {
      label: 'Functions',
      data: store.complexityDistribution.map((b) => b.functionCount),
      backgroundColor: '#42b883',
      borderRadius: 4,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: { display: false },
    tooltip: {
      backgroundColor: '#1e1e3a',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      titleColor: '#e5e7eb',
      bodyColor: '#9ca3af',
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#6b7280', font: { size: 11 } },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#6b7280', font: { size: 11 } },
    },
  },
};
</script>

<template>
  <div class="panel p-4">
    <div class="panel-header -mx-4 -mt-4 mb-4">Complexity Distribution</div>
    <div class="h-64">
      <Bar
        v-if="store.complexityDistribution.length > 0"
        :data="chartData"
        :options="chartOptions"
      />
      <div v-else class="flex items-center justify-center h-full text-gray-500 text-sm">
        No data
      </div>
    </div>
  </div>
</template>
