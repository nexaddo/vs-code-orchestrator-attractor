import { execFile } from "node:child_process";
import crypto from "node:crypto";
import path from "node:path";
import { promisify } from "node:util";

import { WorktreeLeaseSchema, type WorktreeLease } from "@attractor/shared";

import {
  type AcquireInput,
  type ReconcileResult,
  type WorktreeManager
} from "./index";

const execFileAsync = promisify(execFile);

/**
 * Git-backed WorktreeManager implementation.
 *
 * Shells out to `git` via Node child_process for all worktree operations.
 * Leases are kept in memory for this session (M2 skeleton: no persistence layer).
 */
export class GitWorktreeManager implements WorktreeManager {
  private readonly leases = new Map<string, WorktreeLease>();
  /** Operational metadata: maps leaseId → canonical repoPath (main git dir). Not persisted. */
  private readonly repoPathByLease = new Map<string, string>();

  /**
   * Run a git command in the given working directory.
   * Returns stdout as a trimmed string.
   */
  private async git(cwd: string, args: string[]): Promise<string> {
    const { stdout } = await execFileAsync("git", args, { cwd });
    return stdout.trim();
  }

  async acquire(input: AcquireInput): Promise<WorktreeLease> {
    const repoPath = path.resolve(input.repoPath);
    const worktreePath = path.resolve(input.worktreePath);
    const branchName = `attractor/${input.sessionShort}/${input.repoShort}/a${input.attempt}`;
    const now = new Date().toISOString();
    const leaseId = crypto.randomUUID();

    // Create the branch and worktree
    await this.git(repoPath, [
      "worktree",
      "add",
      "-b",
      branchName,
      worktreePath
    ]);

    // Capture the HEAD commit of the new worktree
    let headCommit: string | undefined;
    try {
      headCommit = await this.git(worktreePath, ["rev-parse", "HEAD"]);
    } catch {
      // Not a fatal error if we can't read HEAD (empty repo etc.)
    }

    const lease = WorktreeLeaseSchema.parse({
      version: 1,
      id: leaseId,
      runId: input.runId,
      repositoryId: input.repositoryId,
      branchName,
      worktreePath,
      state: "active",
      headCommit,
      createdAt: now
    });

    this.leases.set(leaseId, lease);
    this.repoPathByLease.set(leaseId, repoPath);
    return lease;
  }

  async release(leaseId: string): Promise<void> {
    const lease = this.leases.get(leaseId);
    if (!lease) {
      throw new Error(`WorktreeManager.release: unknown lease id "${leaseId}"`);
    }

    const repoPath = this.repoPathByLease.get(leaseId);
    if (!repoPath) {
      throw new Error(`WorktreeManager.release: unknown lease id "${leaseId}"`);
    }

    await this.git(repoPath, [
      "worktree",
      "remove",
      "--force",
      lease.worktreePath
    ]);

    const released: WorktreeLease = {
      ...lease,
      state: "released",
      releasedAt: new Date().toISOString()
    };

    this.leases.set(leaseId, released);
    this.repoPathByLease.delete(leaseId);
  }

  async reconcile(): Promise<ReconcileResult> {
    if (this.leases.size === 0) {
      return { healthy: [], orphaned: [], untracked: [] };
    }

    // Collect all unique repo paths to query git worktree list
    const repoPaths = new Set<string>();
    for (const [leaseId, lease] of this.leases.entries()) {
      if (lease.state === "active") {
        const repoPath = this.repoPathByLease.get(leaseId);
        if (repoPath) repoPaths.add(repoPath);
      }
    }

    // Build a set of paths reported by git
    const gitWorktreePaths = new Set<string>();
    for (const repoPath of repoPaths) {
      try {
        const output = await this.git(repoPath, [
          "worktree",
          "list",
          "--porcelain"
        ]);
        for (const line of output.split("\n")) {
          if (line.startsWith("worktree ")) {
            const p = path.resolve(line.slice("worktree ".length).trim());
            gitWorktreePaths.add(p);
          }
        }
      } catch {
        // Repo path may not be valid git; skip
      }
    }

    const healthy: string[] = [];
    const orphaned: string[] = [];

    for (const [leaseId, lease] of this.leases.entries()) {
      if (lease.state !== "active") continue;
      const normalizedPath = path.resolve(lease.worktreePath);
      if (gitWorktreePaths.has(normalizedPath)) {
        healthy.push(leaseId);
        gitWorktreePaths.delete(normalizedPath);
      } else {
        orphaned.push(leaseId);
      }
    }

    // Remaining paths in gitWorktreePaths are untracked by our leases
    const untracked = [...gitWorktreePaths];

    return { healthy, orphaned, untracked };
  }
}
