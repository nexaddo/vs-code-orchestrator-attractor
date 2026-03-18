import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { GraphRecordSchema } from "../../src/contracts";

const fixturesDir = path.resolve(
  __dirname,
  "../../../../test/fixtures/contracts/graphs"
);

const loadFixture = (relativePath: string): unknown => {
  const fullPath = path.join(fixturesDir, relativePath);
  return JSON.parse(readFileSync(fullPath, "utf8")) as unknown;
};

describe("GraphRecordSchema", () => {
  it("accepts a minimal valid graph fixture", () => {
    const parsed = GraphRecordSchema.parse(loadFixture("valid/minimal.json"));

    expect(parsed.version).toBe(1);
    expect(parsed.planId).toBe("plan_001");
    expect(parsed.nodes).toHaveLength(1);
    expect(parsed.nodes[0]?.id).toBe("node_a");
  });

  it("rejects a graph with no nodes", () => {
    const result = GraphRecordSchema.safeParse(
      loadFixture("invalid/empty-nodes.json")
    );

    expect(result.success).toBe(false);
  });

  it("rejects a graph missing planId", () => {
    const result = GraphRecordSchema.safeParse(
      loadFixture("invalid/missing-plan-id.json")
    );

    expect(result.success).toBe(false);
  });

  it("survives a JSON round-trip", () => {
    const fixture = loadFixture("valid/minimal.json");
    const parsed = GraphRecordSchema.parse(fixture);
    const roundTripped = JSON.parse(JSON.stringify(parsed)) as unknown;

    expect(GraphRecordSchema.parse(roundTripped)).toEqual(parsed);
  });
});
