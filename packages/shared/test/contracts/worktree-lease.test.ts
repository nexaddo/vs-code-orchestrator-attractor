import { describe, expect, it } from "vitest";

import { WorktreeLeaseSchema } from "../../src/contracts";

const validLease = {
  version: 1,
  id: "lease-001",
  runId: "run-001",
  repositoryId: "repo-001",
  branchName: "attractor/run-001",
  worktreePath: "/tmp/attractor-worktrees/run-001",
  state: "active",
  createdAt: "2026-01-01T00:00:00.000Z"
};

describe("WorktreeLeaseSchema", () => {
  it("accepts a valid active lease", () => {
    const result = WorktreeLeaseSchema.safeParse(validLease);
    expect(result.success).toBe(true);
  });

  it("accepts all valid states", () => {
    const states = ["active", "released", "orphaned"] as const;
    for (const state of states) {
      const result = WorktreeLeaseSchema.safeParse({ ...validLease, state });
      expect(result.success, `state '${state}' should be valid`).toBe(true);
    }
  });

  it("accepts optional headCommit", () => {
    const result = WorktreeLeaseSchema.safeParse({
      ...validLease,
      headCommit: "abc123"
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional releasedAt", () => {
    const result = WorktreeLeaseSchema.safeParse({
      ...validLease,
      state: "released",
      releasedAt: "2026-01-02T00:00:00.000Z"
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid state", () => {
    const result = WorktreeLeaseSchema.safeParse({
      ...validLease,
      state: "unknown"
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty runId", () => {
    const result = WorktreeLeaseSchema.safeParse({ ...validLease, runId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const { repositoryId: _repositoryId, ...withoutRepo } = validLease;
    void _repositoryId;
    expect(WorktreeLeaseSchema.safeParse(withoutRepo).success).toBe(false);
  });
});
