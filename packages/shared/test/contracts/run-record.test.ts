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

    expect(parsed.id).toBe("run_release_prep_attempt_1");
    expect(parsed.status).toBe("queued");
    expect(parsed.attempt).toBe(1);
  });

  it("rejects a run fixture without a plan id", () => {
    const result = RunRecordSchema.safeParse(
      loadFixture("invalid/missing-plan-id.json")
    );

    expect(result.success).toBe(false);
  });

  it("rejects a run fixture with a zero attempt", () => {
    const result = RunRecordSchema.safeParse(
      loadFixture("invalid/zero-attempt.json")
    );

    expect(result.success).toBe(false);
  });

  it("survives a json round trip", () => {
    const fixture = loadFixture("valid/minimal.json");
    const parsed = RunRecordSchema.parse(fixture);
    const roundTripped = JSON.parse(JSON.stringify(parsed)) as unknown;

    expect(RunRecordSchema.parse(roundTripped)).toEqual(parsed);
  });
});
