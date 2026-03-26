import { execSync } from "child_process";

import { CONTRACT_VERSION } from "@attractor/shared";

import type { EventLog, EventPublisher, WorktreeLeaseStore } from "../../application/ports";

export interface OrphanRecoveryResult {
  readonly detected: string[];
  readonly removed: string[];
}

/**
 * Detects and cleans up orphaned worktree leases on extension startup.
 *
 * A lease is "orphaned" when it exists in leases.json but the corresponding
 * git worktree is no longer registered (e.g., after a crash mid-run or
 * external manual cleanup).
 *
 * When a lease is removed, an `worktree.orphaned` domain event is emitted
 * (one per orphan) so the event log captures the cleanup for audit purposes.
 */
export class OrphanWorktreeRecovery {
  constructor(
    private readonly repoRoot: string,
    private readonly leaseStore: WorktreeLeaseStore,
    private readonly eventLog?: EventLog,
    private readonly publisher?: EventPublisher
  ) {}

  /**
   * Returns the set of worktree paths currently registered with git.
   */
  private listGitWorktreePaths(): Set<string> {
    const output = execSync("git worktree list --porcelain", {
      cwd: this.repoRoot,
      stdio: "pipe"
    }).toString();

    const paths = new Set<string>();
    for (const line of output.split("\n")) {
      if (line.startsWith("worktree ")) {
        paths.add(line.slice("worktree ".length).trim());
      }
    }
    return paths;
  }

  /**
   * Scans leases, removes any whose worktree no longer exists in git,
   * then prunes stale git metadata. Returns detected and removed run IDs.
   */
  async run(): Promise<OrphanRecoveryResult> {
    const leases = await this.leaseStore.listAll();
    if (leases.length === 0) {
      return { detected: [], removed: [] };
    }

    const gitPaths = this.listGitWorktreePaths();
    const detected: string[] = [];
    const removed: string[] = [];

    for (const lease of leases) {
      if (!gitPaths.has(lease.worktreePath)) {
        detected.push(lease.runId);
        await this.leaseStore.release(lease.runId);
        removed.push(lease.runId);

        // Emit domain event for audit trail (optional — only if event infrastructure is wired)
        if (this.eventLog !== undefined && this.publisher !== undefined) {
          const now = new Date().toISOString();
          const envelope = {
            version: CONTRACT_VERSION,
            id: crypto.randomUUID(),
            name: "worktree.orphaned",
            aggregateType: "worktree",
            aggregateId: lease.runId,
            correlationId: lease.runId,
            timestamp: now,
            payload: {
              worktreeId: lease.runId,
              reason: "git worktree no longer registered"
            }
          };
          await this.eventLog.append(lease.runId, envelope);
          await this.publisher.publish({
            id: envelope.id,
            name: envelope.name,
            aggregateType: envelope.aggregateType,
            aggregateId: envelope.aggregateId,
            correlationId: envelope.correlationId,
            timestamp: envelope.timestamp,
            payload: envelope.payload
          });
        }
      }
    }

    if (removed.length > 0) {
      execSync("git worktree prune", {
        cwd: this.repoRoot,
        stdio: "pipe"
      });
    }

    return { detected, removed };
  }
}
