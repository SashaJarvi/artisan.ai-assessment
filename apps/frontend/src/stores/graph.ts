import { ref } from 'vue'
import type { ICytoscapeEdge, ICytoscapeNode, IGraphResponse } from '@cpg-explorer/shared'
import { defineStore } from 'pinia'
import { fetchApi } from '@/api/client'

export const useGraphStore = defineStore('graph', () => {
  const nodes = ref<ICytoscapeNode[]>([])
  const edges = ref<ICytoscapeEdge[]>([])
  const selectedNodeId = ref<string | null>(null)
  const isLoading = ref(false)
  const hasError = ref(false)
  const errorMessage = ref('')
  const isTruncated = ref(false)
  const totalNodes = ref(0)
  const totalEdges = ref(0)

  const setGraphData = (response: IGraphResponse) => {
    nodes.value = response.nodes
    edges.value = response.edges
    isTruncated.value = response.meta.isTruncated
    totalNodes.value = response.meta.totalNodes
    totalEdges.value = response.meta.totalEdges
  }

  const fetchCallChain = async (functionId: string, depth = 3, maxNodes = 60) => {
    isLoading.value = true
    hasError.value = false
    try {
      const res = await fetchApi<IGraphResponse>('/graph/call-chain', {
        function: functionId,
        depth,
        max_nodes: maxNodes
      })
      setGraphData(res)
    } catch (err) {
      hasError.value = true
      errorMessage.value = (err as Error).message
    } finally {
      isLoading.value = false
    }
  }

  const fetchCallers = async (functionId: string, depth = 3, maxNodes = 60) => {
    isLoading.value = true
    hasError.value = false
    try {
      const res = await fetchApi<IGraphResponse>('/graph/callers', {
        function: functionId,
        depth,
        max_nodes: maxNodes
      })
      setGraphData(res)
    } catch (err) {
      hasError.value = true
      errorMessage.value = (err as Error).message
    } finally {
      isLoading.value = false
    }
  }

  const fetchNeighborhood = async (nodeId: string, depth = 1, edgeKinds = 'call') => {
    isLoading.value = true
    hasError.value = false
    try {
      const res = await fetchApi<IGraphResponse>('/graph/neighborhood', {
        node_id: nodeId,
        depth,
        edge_kinds: edgeKinds
      })
      setGraphData(res)
    } catch (err) {
      hasError.value = true
      errorMessage.value = (err as Error).message
    } finally {
      isLoading.value = false
    }
  }

  const fetchModuleGraph = async () => {
    isLoading.value = true
    hasError.value = false
    try {
      const res = await fetchApi<IGraphResponse>('/packages/modules')
      setGraphData(res)
    } catch (err) {
      hasError.value = true
      errorMessage.value = (err as Error).message
    } finally {
      isLoading.value = false
    }
  }

  const fetchPackageGraph = async (module?: string) => {
    isLoading.value = true
    hasError.value = false
    try {
      const params: Record<string, string | number> = {}
      if (module) params.module = module
      const res = await fetchApi<IGraphResponse>('/packages/graph', params)
      setGraphData(res)
    } catch (err) {
      hasError.value = true
      errorMessage.value = (err as Error).message
    } finally {
      isLoading.value = false
    }
  }

  const selectNode = (id: string | null) => {
    selectedNodeId.value = id
  }

  const clear = () => {
    nodes.value = []
    edges.value = []
    selectedNodeId.value = null
    isTruncated.value = false
  }

  return {
    nodes,
    edges,
    selectedNodeId,
    isLoading,
    hasError,
    errorMessage,
    isTruncated,
    totalNodes,
    totalEdges,
    fetchCallChain,
    fetchCallers,
    fetchNeighborhood,
    fetchModuleGraph,
    fetchPackageGraph,
    selectNode,
    clear
  }
})
