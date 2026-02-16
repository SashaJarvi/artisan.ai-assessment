import { ref, shallowRef, onMounted, onUnmounted, watch, type Ref } from 'vue';
import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';
import dagre from 'cytoscape-dagre';
import type { ICytoscapeNode, ICytoscapeEdge } from '@cpg-explorer/shared';

let extensionsRegistered = false;

const registerExtensions = () => {
  if (extensionsRegistered) return;
  cytoscape.use(cola);
  cytoscape.use(dagre);
  extensionsRegistered = true;
};

export interface CytoscapeOptions {
  layout?: string;
  onNodeTap?: (id: string) => void;
  onNodeDblClick?: (id: string) => void;
  onBackgroundTap?: () => void;
}

const defaultStyle: any[] = [
  {
    selector: 'node',
    style: {
      label: 'data(label)',
      'background-color': 'data(color)',
      width: 'data(size)',
      height: 'data(size)',
      'font-size': 10,
      'text-valign': 'bottom',
      'text-margin-y': 5,
      color: '#d1d5db',
      'text-outline-color': '#0f0f23',
      'text-outline-width': 2,
      shape: 'round-rectangle',
      'border-width': 0,
    } as any,
  },
  {
    selector: 'node[!size]',
    style: {
      width: 30,
      height: 30,
    },
  },
  {
    selector: 'edge',
    style: {
      width: 1.5,
      'line-color': '#4b5563',
      'target-arrow-color': '#4b5563',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      opacity: 0.6,
      'arrow-scale': 0.8,
    },
  },
  {
    selector: 'edge[color]',
    style: {
      'line-color': 'data(color)',
      'target-arrow-color': 'data(color)',
    } as any,
  },
  {
    selector: ':selected',
    style: {
      'border-width': 3,
      'border-color': '#42b883',
    },
  },
  {
    selector: 'node:active',
    style: {
      'overlay-opacity': 0.1,
      'overlay-color': '#42b883',
    },
  },
];

const layoutConfigs: Record<string, any> = {
  cola: {
    name: 'cola',
    animate: true,
    maxSimulationTime: 4000,
    nodeSpacing: 25,
    edgeLengthVal: 120,
    fit: true,
    padding: 40,
    nodeDimensionsIncludeLabels: true,
    avoidOverlap: true,
    randomize: false,
  },
  dagre: {
    name: 'dagre',
    rankDir: 'TB',
    nodeSep: 50,
    rankSep: 80,
    edgeSep: 10,
    fit: true,
    padding: 30,
    nodeDimensionsIncludeLabels: true,
    animate: true,
    animationDuration: 300,
  },
  cose: {
    name: 'cose',
    animate: true,
    animationDuration: 500,
    fit: true,
    padding: 30,
    nodeRepulsion: () => 8000,
    idealEdgeLength: () => 100,
    nodeDimensionsIncludeLabels: true,
  },
  circle: {
    name: 'circle',
    fit: true,
    padding: 30,
    animate: true,
    animationDuration: 300,
  },
};

export const useCytoscape = (
  containerRef: Ref<HTMLElement | null>,
  options?: CytoscapeOptions,
) => {
  registerExtensions();

  const cy = shallowRef<cytoscape.Core | null>(null);
  const currentLayout = ref(options?.layout ?? 'cola');
  const isLayoutRunning = ref(false);

  onMounted(() => {
    if (!containerRef.value) return;

    cy.value = cytoscape({
      container: containerRef.value,
      elements: [],
      style: defaultStyle,
      layout: { name: 'preset' },
      minZoom: 0.02,
      maxZoom: 5,
      wheelSensitivity: 0.3,
    });

    cy.value.on('tap', 'node', (evt) => {
      options?.onNodeTap?.(evt.target.id());
    });

    cy.value.on('dbltap', 'node', (evt) => {
      options?.onNodeDblClick?.(evt.target.id());
    });

    cy.value.on('tap', (evt) => {
      if (evt.target === cy.value) {
        options?.onBackgroundTap?.();
      }
    });
  });

  onUnmounted(() => {
    cy.value?.destroy();
    cy.value = null;
  });

  const setElements = (nodes: ICytoscapeNode[], edges: ICytoscapeEdge[]) => {
    if (!cy.value) return;

    cy.value.elements().remove();
    cy.value.add([...nodes, ...edges] as any);
    runLayout(currentLayout.value);
  };

  const runLayout = (name: string) => {
    if (!cy.value) return;
    currentLayout.value = name;
    isLayoutRunning.value = true;
    const config = layoutConfigs[name] ?? layoutConfigs.cola;
    const layout = cy.value.layout(config);
    layout.on('layoutstop', () => {
      isLayoutRunning.value = false;
    });
    layout.run();
  };

  const fitToView = () => {
    cy.value?.fit(undefined, 40);
  };

  const zoomIn = () => {
    if (!cy.value) return;
    cy.value.zoom({ level: cy.value.zoom() * 1.2, renderedPosition: { x: cy.value.width() / 2, y: cy.value.height() / 2 } });
  };

  const zoomOut = () => {
    if (!cy.value) return;
    cy.value.zoom({ level: cy.value.zoom() * 0.8, renderedPosition: { x: cy.value.width() / 2, y: cy.value.height() / 2 } });
  };

  const highlightNode = (id: string) => {
    if (!cy.value) return;
    cy.value.elements().unselect();
    const node = cy.value.$id(id);
    if (node.length) {
      node.select();
      cy.value.animate({ center: { eles: node }, duration: 300 });
    }
  };

  const exportPng = (): string | undefined => {
    return cy.value?.png({ full: true, scale: 2, bg: '#0f0f23' });
  };

  return {
    cy,
    currentLayout,
    isLayoutRunning,
    setElements,
    runLayout,
    fitToView,
    zoomIn,
    zoomOut,
    highlightNode,
    exportPng,
  };
};
