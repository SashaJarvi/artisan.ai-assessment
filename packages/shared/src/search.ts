export interface ISymbolResult {
  id: string;
  name: string;
  kind: string;
  package: string;
  file: string;
  line: number;
  signature: string;
  parent: string | null;
}

export interface IXrefResult {
  defId: string;
  defName: string;
  defFile: string;
  defLine: number;
  useId: string;
  useFile: string;
  useLine: number;
  useKind: string;
}

export interface IFinding {
  id: number;
  category: string;
  severity: string;
  nodeId: string | null;
  file: string | null;
  line: number | null;
  message: string;
  details: string | null;
}
