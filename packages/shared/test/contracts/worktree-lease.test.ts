import { describe, expect, it } from "vitest";

import {
  WorktreeLeaseSchema,
  WorktreeLeaseStoreRecordSchema
} from "../../src/contracts";

describe("WorktreeLeaseSchema", () => {
  it("accepts a valid lease", () => {
    const result = WorktreeLeaseSchema.safeParse({
      version: 1,
      runId: "run-001",
      worktreePath: "/tmp/attractor-worktrees/run-001",
      status: "allocated",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z"
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid statuses", () => {
    const statuses = [
      "allocated",
      "preparing",
      "busy",
      "releasing",
      "retained"
    ] as const;
    for (const status of statuses) {
      const result = WorktreeLeaseSchema.safeParse({
        version: 1,
        runId: "run-001",
        worktreePath: "/tmp/wt",
        status,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      });
      expect(result.success, `status '${status}' should be valid`).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = WorktreeLeaseSchema.safeParse({
      version: 1,
      runId: "run-001",
      worktreePath: "/tmp/wt",
      status: "unknown",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z"
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty runId", () => {
    const result = WorktreeLeaseSchema.safeParse({
      version: 1,
      runId: "",
      worktreePath: "/tmp/wt",
      status: "allocated",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z"
    });
    expect(result.success).toBe(false);
  });
});

describe("WorktreeLeaseStoreRecordSchema", () => {
  it("accepts an empty lease store", () => {
    const result = WorktreeLeaseStoreRecordSchema.safeParse({
      version: 1,
      leases: []
    });
    expect(result.success).toBe(true);
  });

  it("accepts a store with multiple leases", () => {
    const result = WorktreeLeaseStoreRecordSchema.safeParse({
      version: 1,
      leases: [
        {
          version: 1,
          runId: "run-a",
          worktreePath: "/tmp/a",
          status: "busy",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z"
        },
        {
          version: 1,
          runId: "run-b",
          worktreePath: "/tmp/b",
          status: "allocated",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z"
        }
      ]
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing version", () => {
    const result = WorktreeLeaseStoreRecordSchema.safeParse({ leases: [] });
    expect(result.success).toBe(false);
  });
});
