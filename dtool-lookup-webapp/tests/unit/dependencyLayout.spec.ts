import { describe, it, expect } from "vitest";
import {
  dependencyEdges,
  layoutDependencyGraph,
} from "@/utils/dependencyLayout";
import type { GraphDatasetEntry } from "@/services/dserverApi";

function dataset(uuid: string, derived_from: string[] = []) {
  return {
    uuid,
    name: `demo-${uuid}`,
    uri: `s3://bucket/${uuid}`,
    base_uri: "s3://bucket",
    creator_username: "demo",
    created_at: 0,
    frozen_at: 0,
    derived_from,
  } as unknown as GraphDatasetEntry;
}

// raw-a, raw-b -> processed -> analysis -> figures
const GRAPH = [
  dataset("raw-a"),
  dataset("raw-b"),
  dataset("processed", ["raw-a", "raw-b"]),
  dataset("analysis", ["processed"]),
  dataset("figures", ["analysis", "analysis", "missing-parent"]),
];

describe("dependencyEdges", () => {
  it("connects parents to derived datasets, once, within the graph", () => {
    expect(dependencyEdges(GRAPH).map((e) => e.id)).toEqual([
      "raw-a->processed",
      "raw-b->processed",
      "processed->analysis",
      "analysis->figures",
    ]);
  });
});

describe("layoutDependencyGraph", () => {
  it("places datasets left to right by generation", () => {
    const { nodes } = layoutDependencyGraph(GRAPH, "analysis");
    const x = Object.fromEntries(nodes.map((n) => [n.id, n.position.x]));
    expect(x["raw-a"]).toBe(x["raw-b"]);
    expect(x["raw-a"]).toBeLessThan(x["processed"]);
    expect(x["processed"]).toBeLessThan(x["analysis"]);
    expect(x["analysis"]).toBeLessThan(x["figures"]);
  });

  it("marks the current dataset", () => {
    const { nodes } = layoutDependencyGraph(GRAPH, "analysis");
    expect(nodes.filter((n) => n.data.isCurrent).map((n) => n.id)).toEqual([
      "analysis",
    ]);
  });

  it("does not overlap datasets of one generation", () => {
    const { nodes } = layoutDependencyGraph(GRAPH, null);
    const a = nodes.find((n) => n.id === "raw-a")!.position.y;
    const b = nodes.find((n) => n.id === "raw-b")!.position.y;
    expect(Math.abs(a - b)).toBeGreaterThanOrEqual(64);
  });
});
