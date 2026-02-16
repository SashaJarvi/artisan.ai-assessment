import { ref } from 'vue'
import type {
  IComplexityBucket,
  IEdgeDistribution,
  IFindingCategory,
  IHotspot,
  INodeDistribution,
  IOverviewKpi
} from '@cpg-explorer/shared'
import { defineStore } from 'pinia'
import { fetchApi } from '@/api/client'

export const useDashboardStore = defineStore('dashboard', () => {
  const overview = ref<IOverviewKpi[]>([])
  const complexityDistribution = ref<IComplexityBucket[]>([])
  const findingsSummary = ref<IFindingCategory[]>([])
  const hotspots = ref<IHotspot[]>([])
  const nodeDistribution = ref<INodeDistribution[]>([])
  const edgeDistribution = ref<IEdgeDistribution[]>([])
  const isLoading = ref(false)
  const hasError = ref(false)
  const isLoaded = ref(false)

  const fetchAll = async () => {
    if (isLoaded.value) return
    isLoading.value = true
    hasError.value = false

    try {
      const [overviewRes, complexityRes, findingsRes, hotspotsRes, nodeDistRes, edgeDistRes] =
        await Promise.all([
          fetchApi<{ data: IOverviewKpi[] }>('/dashboard/overview'),
          fetchApi<{ data: IComplexityBucket[] }>('/dashboard/complexity-distribution'),
          fetchApi<{ data: IFindingCategory[] }>('/dashboard/findings-summary'),
          fetchApi<{ data: IHotspot[] }>('/dashboard/hotspots', { limit: 20 }),
          fetchApi<{ data: INodeDistribution[] }>('/dashboard/node-distribution'),
          fetchApi<{ data: IEdgeDistribution[] }>('/dashboard/edge-distribution')
        ])

      overview.value = overviewRes.data
      complexityDistribution.value = complexityRes.data
      findingsSummary.value = findingsRes.data
      hotspots.value = hotspotsRes.data
      nodeDistribution.value = nodeDistRes.data
      edgeDistribution.value = edgeDistRes.data
      isLoaded.value = true
    } catch {
      hasError.value = true
    } finally {
      isLoading.value = false
    }
  }

  const getKpi = (key: string): string => {
    const kpi = overview.value.find(k => k.key === key)
    return kpi?.value ?? '—'
  }

  return {
    overview,
    complexityDistribution,
    findingsSummary,
    hotspots,
    nodeDistribution,
    edgeDistribution,
    isLoading,
    hasError,
    isLoaded,
    fetchAll,
    getKpi
  }
})
