// dependencyLayout.ts
//
// Layered (left-to-right) layout of a dataset dependency graph with dagre:
// datasets a dataset was derived from are to its left, datasets derived from
// it to its right.

import { graphlib, layout } from "@dagrejs/dagre";
import type { GraphDatasetEntry } from "@/services/dserverApi";

export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 64;

export interface DatasetNodeData {
  dataset: GraphDatasetEntry;
  isCurrent: boolean;
}

export interface LayoutNode {
  id: string;
  type: "dataset";
  position: { x: number; y: number };
  data: DatasetNodeData;
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
}

/**
 * Edges from each parent (derived_from) to the derived dataset. Parents not
 * in the graph and duplicate edges are left out.
 */
export function dependencyEdges(datasets: GraphDatasetEntry[]): LayoutEdge[] {
  const uuids = new Set(datasets.map((d) => d.uuid));
  const edges = new Map<string, LayoutEdge>();
  for (const dataset of datasets) {
    for (const parent of dataset.derived_from ?? []) {
      if (parent === dataset.uuid || !uuids.has(parent)) continue;
      const id = `${parent}->${dataset.uuid}`;
      edges.set(id, { id, source: parent, target: dataset.uuid });
    }
  }
  return [...edges.values()];
}

/** Positions (top left corners) of the datasets, left to right. */
export function layoutDependencyGraph(
  datasets: GraphDatasetEntry[],
  currentUuid: string | null | undefined,
): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  const edges = dependencyEdges(datasets);

  const g = new graphlib.Graph();
  g.setGraph({
    rankdir: "LR",
    nodesep: 24,
    ranksep: 72,
    marginx: 8,
    marginy: 8,
  });
  g.setDefaultEdgeLabel(() => ({}));
  for (const dataset of datasets) {
    g.setNode(dataset.uuid, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }
  layout(g);

  const nodes = datasets.map((dataset) => {
    const { x, y } = g.node(dataset.uuid);
    return {
      id: dataset.uuid,
      type: "dataset" as const,
      // dagre gives centers; Vue Flow expects top left corners.
      position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
      data: { dataset, isCurrent: dataset.uuid === currentUuid },
    };
  });
  return { nodes, edges };
}
