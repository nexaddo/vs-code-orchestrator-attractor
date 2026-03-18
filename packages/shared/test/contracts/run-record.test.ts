import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { RunRecordSchema } from "../../src/contracts";

const fixturesDir = path.resolve(
  __dirname,
  "../../../../test/fixtures/contracts/runs"
);

const loadFixture = (relativePath: string): unknown => {
  const fullPath = path.join(fixturesDir, relativePath);
  return JSON.parse(readFileSync(fullPath, "utf8")) as unknown;
};

describe("RunRecordSchema", () => {
  it("accepts a minimal valid run fixture", () => {
    const parsed = RunRecordSchema.parse(loadFixture("valid/minimal.json"));

    expect(parsed.version).toBe(1);
    expect(parsed.status).toBe("queued");
    expect(parsed.planId).toBe("plan_001");
    expect(parsed.graphId).toBe("graph_001");
    expect(parsed.worktreeId).toBe("worktree_001");
  });

  it("rejects a run with missing planId", () => {
    const result = RunRecordSchema.safeParse(
      loadFixture("invalid/missing-plan-id.json")
    );

    expect(result.success).toBe(false);
  });

  it("rejects a run with invalid status", () => {
    const result = RunRecordSchema.safeParse(
      loadFixture("invalid/invalid-status.json")
    );

    expect(result.success).toBe(false);
  });

  it("accepts optional startedAt and completedAt when present", () => {
    const parsed = RunRecordSchema.parse(
      loadFixture("valid/with-timestamps.json")
    );

    expect(parsed.startedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(parsed.completedAt).toBe("2026-01-01T00:01:00.000Z");
  });

  it("survives a JSON round-trip", () => {
    const fixture = loadFixture("valid/minimal.json");
    const parsed = RunRecordSchema.parse(fixture);
    const roundTripped = JSON.parse(JSON.stringify(parsed)) as unknown;

    expect(RunRecordSchema.parse(roundTripped)).toEqual(parsed);
  });
});
