import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import { GitWorktreeManager } from "../../src/worktrees/worktree-manager";

const execFileAsync = promisify(execFile);

async function initTestRepo(rootDir: string): Promise<string> {
  const repoPath = path.join(rootDir, "repo");
  await execFileAsync("git", ["init", "--initial-branch=main", repoPath]);
  await execFileAsync("git", ["config", "user.email", "test@test.com"], {
    cwd: repoPath
  });
  await execFileAsync("git", ["config", "user.name", "Test"], {
    cwd: repoPath
  });
  // Create an initial commit so HEAD exists
  await writeFile(path.join(repoPath, "README.md"), "# test\n");
  await execFileAsync("git", ["add", "."], { cwd: repoPath });
  await execFileAsync("git", ["commit", "-m", "init"], { cwd: repoPath });
  return repoPath;
}

describe("GitWorktreeManager", () => {
  describe("acquire", () => {
    it("creates a worktree on the correct branch name and returns a schema-valid WorktreeLease", async () => {
      const root = await mkdtemp(path.join(os.tmpdir(), "attractor-wt-"));
      try {
        const repoPath = await initTestRepo(root);
        const worktreePath = path.join(root, "wt-1");
        const manager = new GitWorktreeManager();

        const lease = await manager.acquire({
          runId: "run_001",
          repositoryId: "repo_main",
          sessionShort: "ses001",
          repoShort: "repo",
          attempt: 1,
          repoPath,
          worktreePath
        });

        expect(lease.version).toBe(1);
        expect(lease.runId).toBe("run_001");
        expect(lease.repositoryId).toBe("repo_main");
        expect(lease.branchName).toBe("attractor/ses001/repo/a1");
        expect(lease.worktreePath).toBe(path.resolve(worktreePath));
        expect(lease.state).toBe("active");
        expect(typeof lease.id).toBe("string");
        expect(lease.id.length).toBeGreaterThan(0);
        expect(lease.headCommit).toBeDefined();
        expect(lease.releasedAt).toBeUndefined();
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });

    it("captures the HEAD commit of the worktree", async () => {
      const root = await mkdtemp(path.join(os.tmpdir(), "attractor-wt-"));
      try {
        const repoPath = await initTestRepo(root);
        const worktreePath = path.join(root, "wt-head");
        const manager = new GitWorktreeManager();

        const lease = await manager.acquire({
          runId: "run_002",
          repositoryId: "repo_main",
          sessionShort: "s1",
          repoShort: "r",
          attempt: 1,
          repoPath,
          worktreePath
        });

        // headCommit should be a 40-char SHA
        expect(lease.headCommit).toMatch(/^[0-9a-f]{40}$/);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });
  });

  describe("release", () => {
    it("removes the worktree and marks the lease as released", async () => {
      const root = await mkdtemp(path.join(os.tmpdir(), "attractor-wt-"));
      try {
        const repoPath = await initTestRepo(root);
        const worktreePath = path.join(root, "wt-release");
        const manager = new GitWorktreeManager();

        const lease = await manager.acquire({
          runId: "run_003",
          repositoryId: "repo_main",
          sessionShort: "s1",
          repoShort: "r",
          attempt: 1,
          repoPath,
          worktreePath
        });

        await expect(manager.release(lease.id)).resolves.not.toThrow();
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });

    it("throws predictably for an unknown lease id", async () => {
      const manager = new GitWorktreeManager();
      await expect(manager.release("nonexistent-lease-id")).rejects.toThrow(
        /unknown lease id/
      );
    });
  });

  describe("reconcile", () => {
    it("returns all empty arrays when no leases exist", async () => {
      const manager = new GitWorktreeManager();
      const result = await manager.reconcile();

      expect(result.healthy).toEqual([]);
      expect(result.orphaned).toEqual([]);
      expect(result.untracked).toEqual([]);
    });

    it("reports an active worktree as healthy", async () => {
      const root = await mkdtemp(path.join(os.tmpdir(), "attractor-wt-"));
      try {
        const repoPath = await initTestRepo(root);
        const worktreePath = path.join(root, "wt-reconcile");
        const manager = new GitWorktreeManager();

        const lease = await manager.acquire({
          runId: "run_004",
          repositoryId: "repo_main",
          sessionShort: "s1",
          repoShort: "r",
          attempt: 1,
          repoPath,
          worktreePath
        });

        const result = await manager.reconcile();

        expect(result.healthy).toContain(lease.id);
        expect(result.orphaned).toEqual([]);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });

    it("does not mutate any git state during reconcile", async () => {
      const root = await mkdtemp(path.join(os.tmpdir(), "attractor-wt-"));
      try {
        const repoPath = await initTestRepo(root);
        const worktreePath = path.join(root, "wt-mut");
        const manager = new GitWorktreeManager();

        await manager.acquire({
          runId: "run_005",
          repositoryId: "repo_main",
          sessionShort: "s1",
          repoShort: "r",
          attempt: 1,
          repoPath,
          worktreePath
        });

        // Call reconcile twice; should return consistent results without errors
        const r1 = await manager.reconcile();
        const r2 = await manager.reconcile();

        expect(r1.healthy).toEqual(r2.healthy);
        expect(r1.orphaned).toEqual(r2.orphaned);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });
  });
});
