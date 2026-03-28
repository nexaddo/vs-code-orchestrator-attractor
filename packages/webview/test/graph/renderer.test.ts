import { describe, it, expect } from "vitest";
import { renderGraph } from "../../src/graph/renderer";
import type { GraphState } from "../../src/graph/model";

const baseGraph = {
  version: 1 as const,
  id: "graph_001",
  planId: "plan_001",
  source: "digraph G { A -> B }",
  nodes: [
    { id: "A", label: "Step A", dependsOn: [] },
    { id: "B", label: "Step B", dependsOn: ["A"] }
  ],
  createdAt: "2026-01-01T00:00:00.000Z"
};

const baseState: GraphState = {
  runId: "run_001",
  graph: baseGraph,
  nodeStatuses: [
    { nodeId: "A", status: "done" },
    { nodeId: "B", status: "running" }
  ]
};

describe("renderGraph", () => {
  it("should render Graph View heading", () => {
    const html = renderGraph(baseState);
    expect(html).toContain("<h1>Graph View</h1>");
    expect(html).toContain("graph-container");
  });

  it("should render run ID", () => {
    const html = renderGraph(baseState);
    expect(html).toContain("run_001");
  });

  it("should render node labels", () => {
    const html = renderGraph(baseState);
    expect(html).toContain("Step A");
    expect(html).toContain("Step B");
  });

  it("should render node status CSS classes", () => {
    const html = renderGraph(baseState);
    expect(html).toContain("graph-node--done");
    expect(html).toContain("graph-node--running");
  });

  it("should render legend with status counts", () => {
    const html = renderGraph(baseState);
    expect(html).toContain("legend-item--done");
    expect(html).toContain("legend-item--running");
    expect(html).toContain("Done: 1");
    expect(html).toContain("Running: 1");
    expect(html).toContain("Pending: 0");
    expect(html).toContain("Failed: 0");
  });

  it("should render dependencies", () => {
    const html = renderGraph(baseState);
    expect(html).toContain("node-deps");
    expect(html).toContain("← A");
  });

  it("should render pending status for nodes not in nodeStatuses", () => {
    const state: GraphState = {
      runId: "run_001",
      graph: baseGraph,
      nodeStatuses: []
    };
    const html = renderGraph(state);
    expect(html).toContain("graph-node--pending");
    expect(html).toContain("Pending: 2");
  });

  it("should render failed nodes", () => {
    const state: GraphState = {
      ...baseState,
      nodeStatuses: [
        { nodeId: "A", status: "failed" },
        { nodeId: "B", status: "pending" }
      ]
    };
    const html = renderGraph(state);
    expect(html).toContain("graph-node--failed");
    expect(html).toContain("Failed: 1");
  });

  it("should escape HTML in node labels", () => {
    const state: GraphState = {
      runId: "run_001",
      graph: {
        ...baseGraph,
        nodes: [
          { id: "A", label: "<script>alert('xss')</script>", dependsOn: [] }
        ]
      },
      nodeStatuses: []
    };
    const html = renderGraph(state);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
