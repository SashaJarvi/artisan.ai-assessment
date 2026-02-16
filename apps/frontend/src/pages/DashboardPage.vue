<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useDashboardStore } from '@/stores/dashboard';
import KpiCards from '@/components/dashboard/KpiCards.vue';
import ComplexityChart from '@/components/dashboard/ComplexityChart.vue';
import FindingsSummary from '@/components/dashboard/FindingsSummary.vue';
import HotspotTable from '@/components/dashboard/HotspotTable.vue';

const store = useDashboardStore();
const router = useRouter();

onMounted(() => {
  store.fetchAll();
});

const navigateToFunction = (functionId: string) => {
  router.push({ name: 'call-graph', query: { fn: functionId } });
};
</script>

<template>
  <div class="p-4 space-y-4 max-w-7xl mx-auto">
    <!-- Loading skeleton -->
    <template v-if="store.isLoading && !store.isLoaded">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="panel p-4 animate-pulse">
          <div class="h-3 bg-white/5 rounded w-20 mb-2" />
          <div class="h-6 bg-white/5 rounded w-16" />
        </div>
      </div>
    </template>

    <!-- Error state -->
    <div v-else-if="store.hasError" class="panel p-6 text-center">
      <p class="text-red-400 text-sm mb-2">Failed to load dashboard data</p>
      <button class="btn-primary" @click="store.fetchAll()">Retry</button>
    </div>

    <!-- Dashboard content -->
    <template v-else>
      <KpiCards />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ComplexityChart />
        <FindingsSummary />
      </div>

      <HotspotTable @navigate="navigateToFunction" />
    </template>
  </div>
</template>
