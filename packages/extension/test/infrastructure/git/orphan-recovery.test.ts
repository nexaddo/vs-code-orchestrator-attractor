import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OrphanWorktreeRecovery } from "../../../src/infrastructure/git/orphan-recovery";
import { FileWorktreeLeaseStore } from "../../../src/infrastructure/storage";

// Stub execSync so tests don't require a real git repo
vi.mock("child_process", () => ({
  execSync: vi.fn()
}));

import { execSync } from "child_process";
const mockExecSync = vi.mocked(execSync);

describe("OrphanWorktreeRecovery", () => {
  let tmpDir: string;
  let leaseStore: FileWorktreeLeaseStore;
  let recovery: OrphanWorktreeRecovery;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "attractor-orphan-recovery-")
    );
    leaseStore = new FileWorktreeLeaseStore(tmpDir);
    recovery = new OrphanWorktreeRecovery(tmpDir, leaseStore);
    vi.resetAllMocks();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("returns empty result when no leases exist", async () => {
    mockExecSync.mockReturnValue(
      Buffer.from("worktree /repo\nHEAD abc123\nbranch refs/heads/main\n")
    );

    const result = await recovery.run();

    expect(result.detected).toEqual([]);
    expect(result.removed).toEqual([]);
  });

  it("skips healthy leases whose worktree is still registered", async () => {
    await leaseStore.allocate(
      "run-healthy",
      "/repo/.attractor-worktrees/run-healthy"
    );

    mockExecSync.mockReturnValue(
      Buffer.from(
        "worktree /repo\nHEAD abc\nbranch refs/heads/main\n\n" +
          "worktree /repo/.attractor-worktrees/run-healthy\nHEAD def\ndetached\n"
      )
    );

    const result = await recovery.run();

    expect(result.detected).toEqual([]);
    expect(result.removed).toEqual([]);
    // leaseStore still has the healthy lease
    expect(await leaseStore.findByRunId("run-healthy")).toBeDefined();
    // git worktree prune was NOT called
    const calls = mockExecSync.mock.calls;
    expect(calls.some((c) => String(c[0]).includes("prune"))).toBe(false);
  });

  it("detects and removes an orphaned lease", async () => {
    await leaseStore.allocate(
      "run-orphan",
      "/repo/.attractor-worktrees/run-orphan"
    );

    // Only the main worktree is registered — the orphan is gone
    mockExecSync.mockReturnValue(
      Buffer.from("worktree /repo\nHEAD abc\nbranch refs/heads/main\n")
    );

    const result = await recovery.run();

    expect(result.detected).toEqual(["run-orphan"]);
    expect(result.removed).toEqual(["run-orphan"]);
    expect(await leaseStore.findByRunId("run-orphan")).toBeUndefined();
    // git worktree prune was called
    const calls = mockExecSync.mock.calls;
    expect(calls.some((c) => String(c[0]).includes("prune"))).toBe(true);
  });

  it("handles mixed healthy and orphaned leases", async () => {
    await leaseStore.allocate("run-alive", "/wt/run-alive");
    await leaseStore.allocate("run-dead-1", "/wt/run-dead-1");
    await leaseStore.allocate("run-dead-2", "/wt/run-dead-2");

    mockExecSync.mockReturnValue(
      Buffer.from(
        "worktree /repo\nHEAD abc\nbranch refs/heads/main\n\n" +
          "worktree /wt/run-alive\nHEAD def\ndetached\n"
      )
    );

    const result = await recovery.run();

    expect(result.detected.sort()).toEqual(["run-dead-1", "run-dead-2"]);
    expect(result.removed.sort()).toEqual(["run-dead-1", "run-dead-2"]);
    expect(await leaseStore.findByRunId("run-alive")).toBeDefined();
    expect(await leaseStore.findByRunId("run-dead-1")).toBeUndefined();
    expect(await leaseStore.findByRunId("run-dead-2")).toBeUndefined();
  });
});
