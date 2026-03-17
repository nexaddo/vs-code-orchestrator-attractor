import { type WorktreeLease } from "@attractor/shared";

/**
 * Input for acquiring a new worktree lease.
 */
export interface AcquireInput {
  /** Identifies the run this worktree is being acquired for. */
  runId: string;
  /** Identifies the repository to create the worktree in. */
  repositoryId: string;
  /** Short session identifier, used in branch name construction. */
  sessionShort: string;
  /** Short repo identifier, used in branch name construction. */
  repoShort: string;
  /** Attempt number for this run (used in branch naming). */
  attempt: number;
  /** Absolute path to the repository root to create the worktree under. */
  repoPath: string;
  /** Absolute path where the worktree should be created. */
  worktreePath: string;
}

/**
 * Result of a reconcile operation.
 */
export interface ReconcileResult {
  /** Lease IDs that are tracked and present in git. */
  healthy: string[];
  /** Lease IDs that are tracked but missing from git (orphaned). */
  orphaned: string[];
  /** Git worktree paths that exist but are not tracked by any lease. */
  untracked: string[];
}

/**
 * WorktreeManager provides acquire/release/reconcile lifecycle for git worktrees
 * associated with Attractor runs.
 *
 * Branch naming convention: attractor/<sessionShort>/<repoShort>/a<attempt>
 */
export interface WorktreeManager {
  /**
   * Create a git worktree and return a schema-valid WorktreeLease.
   * Branch name follows: attractor/<sessionShort>/<repoShort>/a<attempt>
   */
  acquire(input: AcquireInput): Promise<WorktreeLease>;

  /**
   * Remove a worktree created by this manager.
   * Throws predictably for an unknown lease id.
   */
  release(leaseId: string): Promise<void>;

  /**
   * Report known vs. actual git worktrees without mutating any git state.
   * Read-only in M2.
   */
  reconcile(): Promise<ReconcileResult>;
}
