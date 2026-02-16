export interface ISourceFile {
  file: string;
  content: string;
  package: string;
}

export interface IOutlineEntry {
  file: string;
  id: string;
  name: string;
  kind: string;
  line: number;
  endLine: number;
  signature: string;
  parentId: string | null;
  depth: number;
}

export interface IHighlightedLine {
  file: string;
  line: number;
  endLine?: number;
  kind?: string;
}
