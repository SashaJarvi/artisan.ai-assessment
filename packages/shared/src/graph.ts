export interface IGraphNode {
  id: string;
  label: string;
  kind: string;
  package?: string;
  file?: string;
  line?: number;
  endLine?: number;
  size?: number;
  color?: string;
  parentFunction?: string;
  typeInfo?: string;
  properties?: Record<string, unknown>;
}

export interface IGraphEdge {
  id: string;
  source: string;
  target: string;
  kind: string;
  label?: string;
  properties?: Record<string, unknown>;
}

export interface ICytoscapeNode {
  data: IGraphNode;
  classes?: string;
}

export interface ICytoscapeEdge {
  data: IGraphEdge;
  classes?: string;
}

export interface IGraphResponse {
  nodes: ICytoscapeNode[];
  edges: ICytoscapeEdge[];
  meta: {
    totalNodes: number;
    totalEdges: number;
    isTruncated: boolean;
  };
}

export interface IPackageGraphNode extends IGraphNode {
  fileCount?: number;
  functionCount?: number;
  totalLoc?: number;
  totalComplexity?: number;
  avgComplexity?: number;
  module?: string;
}
