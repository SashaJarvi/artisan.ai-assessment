<script setup lang="ts">
import { computed } from 'vue'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import { useDashboardStore } from '@/stores/dashboard'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const store = useDashboardStore()

const severityColors: Record<string, string> = {
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6'
}

const chartData = computed(() => ({
  labels: store.findingsSummary.map(f => f.category.replace(/_/g, ' ')),
  datasets: [
    {
      label: 'Findings',
      data: store.findingsSummary.map(f => f.count),
      backgroundColor: store.findingsSummary.map(f => severityColors[f.severity] ?? '#6b7280'),
      borderRadius: 4
    }
  ]
}))

const chartOptions = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    tooltip: {
      backgroundColor: '#1e1e3a',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      titleColor: '#e5e7eb',
      bodyColor: '#9ca3af'
    }
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#6b7280', font: { size: 11 } }
    },
    y: {
      grid: { display: false },
      ticks: { color: '#9ca3af', font: { size: 10 } }
    }
  }
}
</script>

<template>
  <div class="panel p-4">
    <div class="panel-header -mx-4 -mt-4 mb-4">
      Findings by Category
    </div>
    <div class="h-64">
      <Bar
        v-if="store.findingsSummary.length > 0"
        :data="chartData"
        :options="chartOptions"
      />
      <div
        v-else
        class="flex items-center justify-center h-full text-gray-500 text-sm"
      >
        No data
      </div>
    </div>
  </div>
</template>
