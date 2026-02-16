export interface IOverviewKpi {
  key: string;
  value: string;
}

export interface IComplexityBucket {
  bucket: string;
  bucketMin: number;
  bucketMax: number;
  functionCount: number;
}

export interface IFindingCategory {
  category: string;
  severity: string;
  count: number;
}

export interface IHotspot {
  functionId: string;
  name: string;
  package: string;
  file: string;
  complexity: number;
  loc: number;
  fanIn: number;
  fanOut: number;
  findingCount: number;
  hotspotScore: number;
}

export interface ITopFunction {
  metric: string;
  rank: number;
  functionId: string;
  name: string;
  package: string;
  file: string;
  value: number;
}

export interface IPackageTreemapEntry {
  package: string;
  fileCount: number;
  functionCount: number;
  totalLoc: number;
  totalComplexity: number;
  avgComplexity: number;
  maxComplexity: number;
  typeCount: number;
  interfaceCount: number;
}

export interface INodeDistribution {
  nodeKind: string;
  count: number;
  percentage: number;
}

export interface IEdgeDistribution {
  edgeKind: string;
  count: number;
  percentage: number;
}

export interface IFileHeatmapEntry {
  file: string;
  package: string;
  functionCount: number;
  totalLoc: number;
  totalComplexity: number;
  maxComplexity: number;
  avgComplexity: number;
  findingCount: number;
  hotspotScore: number;
}

export interface IFunctionDetail {
  functionId: string;
  name: string;
  package: string;
  file: string;
  line: number;
  endLine: number;
  signature: string;
  complexity: number;
  loc: number;
  fanIn: number;
  fanOut: number;
  numParams: number;
  numLocals: number;
  numCalls: number;
  numBranches: number;
  numReturns: number;
  findingCount: number;
  callers: string;
  callees: string;
}
