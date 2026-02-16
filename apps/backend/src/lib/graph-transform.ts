import type { ICytoscapeEdge, ICytoscapeNode, IGraphResponse } from '@cpg-explorer/shared'

export interface RawNode {
  id: string;
  kind: string;
  name: string;
  file?: string;
  line?: number;
  col?: number;
  end_line?: number;
  package?: string;
  parent_function?: string;
  type_info?: string;
  properties?: string;
  depth?: number;
}

export interface RawEdge {
  source: string;
  target: string;
  kind: string;
  properties?: string;
  label?: string;
}

const MODULE_COLORS: Record<string, string> = {
  prometheus: '#e6194b',
  client_golang: '#3cb44b',
  adapter: '#4363d8',
  alertmanager: '#f58231',
  default: '#42b883'
}

const EDGE_COLORS: Record<string, string> = {
  call: '#3b82f6',
  dfg: '#f59e0b',
  cfg: '#6b7280',
  ast: '#42b883',
  cdg: '#8b5cf6',
  implements: '#ec4899',
  embeds: '#14b8a6'
}

export const getModuleFromPackage = (pkg: string | undefined): string => {
  if (!pkg) return 'default'
  // Check specific modules first (order matters: most specific first)
  if (pkg.includes('client_golang') || pkg.startsWith('client_golang')) return 'client_golang'
  if (pkg.includes('prometheus-adapter') || pkg.includes('sigs.k8s.io/prometheus-adapter') || pkg.startsWith('adapter')) return 'adapter'
  if (pkg.includes('alertmanager') || pkg.startsWith('alertmanager')) return 'alertmanager'
  // Full GitHub path match for prometheus
  if (pkg.includes('prometheus/prometheus') || pkg.startsWith('github.com/prometheus/prometheus')) return 'prometheus'
  // Short package names (tsdb, promql, model/, storage/, etc.) belong to prometheus
  // as it's the primary module — everything not matched above is prometheus
  return 'prometheus'
}

export const getModuleColor = (pkg: string | undefined): string => {
  const mod = getModuleFromPackage(pkg)
  return MODULE_COLORS[mod] ?? MODULE_COLORS.default
}

export const getEdgeColor = (kind: string): string => {
  return EDGE_COLORS[kind] ?? '#6b7280'
}

export const transformNodes = (rows: RawNode[]): ICytoscapeNode[] => {
  return rows.map(row => ({
    data: {
      id: row.id,
      label: row.name,
      kind: row.kind,
      package: row.package,
      file: row.file,
      line: row.line,
      endLine: row.end_line,
      parentFunction: row.parent_function,
      typeInfo: row.type_info,
      color: getModuleColor(row.package),
      properties: row.properties ? JSON.parse(row.properties) : undefined
    },
    classes: row.kind
  }))
}

export const transformEdges = (rows: RawEdge[]): ICytoscapeEdge[] => {
  return rows.map((row, idx) => ({
    data: {
      id: `e-${row.source}-${row.target}-${row.kind}-${idx}`,
      source: row.source,
      target: row.target,
      kind: row.kind,
      label: row.label,
      color: getEdgeColor(row.kind),
      properties: row.properties ? JSON.parse(row.properties) : undefined
    },
    classes: row.kind
  }))
}

export const buildGraphResponse = (
  nodes: ICytoscapeNode[],
  edges: ICytoscapeEdge[],
  maxNodes = 200
): IGraphResponse => {
  const isTruncated = nodes.length > maxNodes
  const truncatedNodes = isTruncated ? nodes.slice(0, maxNodes) : nodes
  const nodeIds = new Set(truncatedNodes.map(n => n.data.id))
  const filteredEdges = edges.filter(
    e => nodeIds.has(e.data.source) && nodeIds.has(e.data.target)
  )

  return {
    nodes: truncatedNodes,
    edges: filteredEdges,
    meta: {
      totalNodes: nodes.length,
      totalEdges: filteredEdges.length,
      isTruncated
    }
  }
}
