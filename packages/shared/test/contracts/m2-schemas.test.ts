import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  ExtensionEventSchema,
  MilestoneRecordSchema,
  RunSnapshotSchema,
  WorktreeLeaseSchema
} from "../../src/contracts";

const fixturesDir = path.resolve(
  __dirname,
  "../../../../test/fixtures/contracts"
);

const loadFixture = (relativePath: string): unknown => {
  const fullPath = path.join(fixturesDir, relativePath);
  return JSON.parse(readFileSync(fullPath, "utf8")) as unknown;
};

// ── ExtensionEventSchema ──────────────────────────────────────────────────────

describe("ExtensionEventSchema", () => {
  it("accepts a minimal valid event fixture", () => {
    const parsed = ExtensionEventSchema.parse(
      loadFixture("events/valid/minimal.json")
    );

    expect(parsed.id).toBe("evt_001");
    expect(parsed.entityType).toBe("run");
    expect(parsed.kind).toBe("created");
  });

  it("rejects an event fixture with missing entityType", () => {
    const result = ExtensionEventSchema.safeParse(
      loadFixture("events/invalid/missing-entity-type.json")
    );

    expect(result.success).toBe(false);
  });

  it("survives a json round trip", () => {
    const fixture = loadFixture("events/valid/minimal.json");
    const parsed = ExtensionEventSchema.parse(fixture);
    const roundTripped = JSON.parse(JSON.stringify(parsed)) as unknown;

    expect(ExtensionEventSchema.parse(roundTripped)).toEqual(parsed);
  });
});

// ── WorktreeLeaseSchema ───────────────────────────────────────────────────────

describe("WorktreeLeaseSchema", () => {
  it("accepts a valid active lease fixture", () => {
    const parsed = WorktreeLeaseSchema.parse(
      loadFixture("worktree-leases/valid/active.json")
    );

    expect(parsed.id).toBe("lease_001");
    expect(parsed.state).toBe("active");
    expect(parsed.runId).toBe("run_001");
  });

  it("rejects a lease fixture with an invalid state", () => {
    const result = WorktreeLeaseSchema.safeParse(
      loadFixture("worktree-leases/invalid/bad-state.json")
    );

    expect(result.success).toBe(false);
  });

  it("survives a json round trip", () => {
    const fixture = loadFixture("worktree-leases/valid/active.json");
    const parsed = WorktreeLeaseSchema.parse(fixture);
    const roundTripped = JSON.parse(JSON.stringify(parsed)) as unknown;

    expect(WorktreeLeaseSchema.parse(roundTripped)).toEqual(parsed);
  });
});

// ── MilestoneRecordSchema ─────────────────────────────────────────────────────

describe("MilestoneRecordSchema", () => {
  it("accepts a minimal valid milestone fixture", () => {
    const parsed = MilestoneRecordSchema.parse(
      loadFixture("milestones/valid/minimal.json")
    );

    expect(parsed.id).toBe("ms_001");
    expect(parsed.planId).toBe("plan_001");
    expect(parsed.status).toBe("pending");
    expect(parsed.order).toBe(0);
  });

  it("rejects a milestone fixture without a planId", () => {
    const result = MilestoneRecordSchema.safeParse(
      loadFixture("milestones/invalid/missing-plan-id.json")
    );

    expect(result.success).toBe(false);
  });

  it("survives a json round trip", () => {
    const fixture = loadFixture("milestones/valid/minimal.json");
    const parsed = MilestoneRecordSchema.parse(fixture);
    const roundTripped = JSON.parse(JSON.stringify(parsed)) as unknown;

    expect(MilestoneRecordSchema.parse(roundTripped)).toEqual(parsed);
  });
});

// ── RunSnapshotSchema ─────────────────────────────────────────────────────────

describe("RunSnapshotSchema", () => {
  it("accepts a minimal valid snapshot fixture with null milestone and checkpoint", () => {
    const parsed = RunSnapshotSchema.parse(
      loadFixture("run-snapshots/valid/minimal.json")
    );

    expect(parsed.runId).toBe("run_001");
    expect(parsed.status).toBe("running");
    expect(parsed.currentMilestoneId).toBeNull();
    expect(parsed.lastCheckpointId).toBeNull();
  });

  it("rejects a snapshot fixture without a runId", () => {
    const result = RunSnapshotSchema.safeParse(
      loadFixture("run-snapshots/invalid/missing-run-id.json")
    );

    expect(result.success).toBe(false);
  });

  it("survives a json round trip", () => {
    const fixture = loadFixture("run-snapshots/valid/minimal.json");
    const parsed = RunSnapshotSchema.parse(fixture);
    const roundTripped = JSON.parse(JSON.stringify(parsed)) as unknown;

    expect(RunSnapshotSchema.parse(roundTripped)).toEqual(parsed);
  });

  it("accepts a snapshot with non-null milestone and checkpoint ids", () => {
    const snapshot = {
      version: 1,
      runId: "run_002",
      status: "running",
      currentMilestoneId: "ms_001",
      lastCheckpointId: "chk_001",
      snapshotAt: "2026-03-16T01:00:00Z"
    };

    const parsed = RunSnapshotSchema.parse(snapshot);
    expect(parsed.currentMilestoneId).toBe("ms_001");
    expect(parsed.lastCheckpointId).toBe("chk_001");
  });
});
