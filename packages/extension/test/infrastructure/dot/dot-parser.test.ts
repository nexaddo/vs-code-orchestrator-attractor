import { describe, expect, it } from "vitest";

import { DotParseError, parseDot } from "../../../src/infrastructure/dot";

describe("parseDot", () => {
  it("parses a minimal digraph with two nodes and one edge", () => {
    const src = `
      digraph G {
        A -> B
      }
    `;
    const { nodes } = parseDot(src);
    expect(nodes).toHaveLength(2);
    const a = nodes.find((n) => n.id === "A");
    const b = nodes.find((n) => n.id === "B");
    expect(a?.dependsOn).toEqual([]);
    expect(b?.dependsOn).toEqual(["A"]);
  });

  it("reads node label from attributes", () => {
    const src = `
      digraph {
        A [label="Step Alpha"]
        B [label="Step Beta"]
        A -> B
      }
    `;
    const { nodes } = parseDot(src);
    const a = nodes.find((n) => n.id === "A");
    const b = nodes.find((n) => n.id === "B");
    expect(a?.label).toBe("Step Alpha");
    expect(b?.label).toBe("Step Beta");
  });

  it("falls back to id as label when no label attribute", () => {
    const src = `digraph { X -> Y }`;
    const { nodes } = parseDot(src);
    const x = nodes.find((n) => n.id === "X");
    expect(x?.label).toBe("X");
  });

  it("handles multi-hop edge chain", () => {
    const src = `digraph G { A -> B -> C -> D }`;
    const { nodes } = parseDot(src);
    expect(nodes).toHaveLength(4);
    expect(nodes.find((n) => n.id === "B")?.dependsOn).toEqual(["A"]);
    expect(nodes.find((n) => n.id === "C")?.dependsOn).toEqual(["B"]);
    expect(nodes.find((n) => n.id === "D")?.dependsOn).toEqual(["C"]);
  });

  it("handles multiple edges from one source", () => {
    const src = `
      digraph {
        A -> B
        A -> C
      }
    `;
    const { nodes } = parseDot(src);
    expect(nodes.find((n) => n.id === "B")?.dependsOn).toEqual(["A"]);
    expect(nodes.find((n) => n.id === "C")?.dependsOn).toEqual(["A"]);
  });

  it("handles multiple sources for one target (fan-in)", () => {
    const src = `
      digraph {
        A -> C
        B -> C
      }
    `;
    const { nodes } = parseDot(src);
    const c = nodes.find((n) => n.id === "C");
    expect(c?.dependsOn.sort()).toEqual(["A", "B"]);
  });

  it("accepts node with lane annotation (lane ignored in output)", () => {
    const src = `
      digraph {
        A [label="Step A", lane="lane1"]
        B [label="Step B"]
        A -> B
      }
    `;
    const { nodes } = parseDot(src);
    const a = nodes.find((n) => n.id === "A");
    expect(a?.label).toBe("Step A");
  });

  it("accepts edge with label attribute", () => {
    const src = `digraph { A -> B [label="edge label"] }`;
    const { nodes } = parseDot(src);
    expect(nodes).toHaveLength(2);
  });

  it("accepts subgraph blocks", () => {
    const src = `
      digraph {
        subgraph lane1 {
          A [label="Step A"]
          B [label="Step B"]
        }
        A -> B
      }
    `;
    const { nodes } = parseDot(src);
    expect(nodes).toHaveLength(2);
    expect(nodes.find((n) => n.id === "B")?.dependsOn).toEqual(["A"]);
  });

  it("accepts strict digraph keyword", () => {
    const src = `strict digraph G { X -> Y }`;
    const { nodes } = parseDot(src);
    expect(nodes).toHaveLength(2);
  });

  it("ignores line comments", () => {
    const src = `
      digraph G {
        // this is a comment
        A -> B
      }
    `;
    const { nodes } = parseDot(src);
    expect(nodes).toHaveLength(2);
  });

  it("ignores block comments", () => {
    const src = `
      digraph G {
        /* block comment */
        A -> B
      }
    `;
    const { nodes } = parseDot(src);
    expect(nodes).toHaveLength(2);
  });

  it("handles semicolons as optional statement separators", () => {
    const src = `digraph G { A -> B; B -> C; }`;
    const { nodes } = parseDot(src);
    expect(nodes).toHaveLength(3);
  });

  it("handles graph with graph/node/edge attribute blocks", () => {
    const src = `
      digraph G {
        graph [rankdir=LR]
        node [shape=box]
        edge [color=blue]
        A -> B
      }
    `;
    const { nodes } = parseDot(src);
    expect(nodes).toHaveLength(2);
  });

  it("throws DotParseError for unterminated string", () => {
    const src = `digraph { A [label="bad] }`;
    expect(() => parseDot(src)).toThrow(DotParseError);
  });

  it("returns standalone node with no edges", () => {
    const src = `digraph { A [label="Isolated"] }`;
    const { nodes } = parseDot(src);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.dependsOn).toEqual([]);
  });

  it("handles quoted node ids", () => {
    const src = `digraph { "step-1" -> "step-2" }`;
    const { nodes } = parseDot(src);
    expect(nodes).toHaveLength(2);
    const s2 = nodes.find((n) => n.id === "step-2");
    expect(s2?.dependsOn).toEqual(["step-1"]);
  });
});
