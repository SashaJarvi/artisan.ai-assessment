/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

declare module 'cytoscape-cola' {
  import type cytoscape from 'cytoscape';
  const ext: cytoscape.Ext;
  export default ext;
}

declare module 'cytoscape-dagre' {
  import type cytoscape from 'cytoscape';
  const ext: cytoscape.Ext;
  export default ext;
}
