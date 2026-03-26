import { describe, expect, it } from "vitest";

import {
  OrphanedWorktreeDetectedPayloadSchema,
  RunResumedPayloadSchema,
  RunSnapshotSchema
} from "../../src/contracts";

const validRunRecord = {
  version: 1 as const,
  id: "run-abc",
  planId: "plan-1",
  graphId: "graph-1",
  worktreeId: "wt-1",
  status: "running" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:01:00.000Z"
};

describe("RunSnapshotSchema", () => {
  it("parses a valid snapshot", () => {
    const snapshot = {
      version: 1,
      runId: "run-abc",
      lastEventIndex: 3,
      runRecord: validRunRecord
    };
    const result = RunSnapshotSchema.safeParse(snapshot);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.runId).toBe("run-abc");
      expect(result.data.lastEventIndex).toBe(3);
      expect(result.data.runRecord.status).toBe("running");
    }
  });

  it("rejects lastEventIndex < 0", () => {
    const snapshot = {
      version: 1,
      runId: "run-abc",
      lastEventIndex: -1,
      runRecord: validRunRecord
    };
    expect(RunSnapshotSchema.safeParse(snapshot).success).toBe(false);
  });

  it("rejects missing runId", () => {
    const snapshot = { version: 1, lastEventIndex: 0, runRecord: validRunRecord };
    expect(RunSnapshotSchema.safeParse(snapshot).success).toBe(false);
  });

  it("requires version: 1", () => {
    const snapshot = {
      version: 2,
      runId: "run-abc",
      lastEventIndex: 0,
      runRecord: validRunRecord
    };
    expect(RunSnapshotSchema.safeParse(snapshot).success).toBe(false);
  });

  it("accepts lastEventIndex of 0 (first event)", () => {
    const snapshot = {
      version: 1,
      runId: "run-abc",
      lastEventIndex: 0,
      runRecord: validRunRecord
    };
    expect(RunSnapshotSchema.safeParse(snapshot).success).toBe(true);
  });
});

describe("RunResumedPayloadSchema", () => {
  it("parses a valid payload", () => {
    const result = RunResumedPayloadSchema.safeParse({ resumedFromEventIndex: 5 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.resumedFromEventIndex).toBe(5);
    }
  });

  it("accepts resumedFromEventIndex of 0", () => {
    expect(
      RunResumedPayloadSchema.safeParse({ resumedFromEventIndex: 0 }).success
    ).toBe(true);
  });

  it("rejects negative resumedFromEventIndex", () => {
    expect(
      RunResumedPayloadSchema.safeParse({ resumedFromEventIndex: -1 }).success
    ).toBe(false);
  });

  it("rejects missing field", () => {
    expect(RunResumedPayloadSchema.safeParse({}).success).toBe(false);
  });
});

describe("OrphanedWorktreeDetectedPayloadSchema", () => {
  it("parses a valid payload", () => {
    const result = OrphanedWorktreeDetectedPayloadSchema.safeParse({
      worktreeId: "wt-orphan",
      reason: "git worktree no longer registered"
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.worktreeId).toBe("wt-orphan");
      expect(result.data.reason).toBe("git worktree no longer registered");
    }
  });

  it("rejects empty worktreeId", () => {
    expect(
      OrphanedWorktreeDetectedPayloadSchema.safeParse({
        worktreeId: "",
        reason: "some reason"
      }).success
    ).toBe(false);
  });

  it("rejects missing reason", () => {
    expect(
      OrphanedWorktreeDetectedPayloadSchema.safeParse({ worktreeId: "wt-1" }).success
    ).toBe(false);
  });
});
