import { execSync } from "child_process";
import * as path from "path";

import type { WorktreeManager } from "../../application/ports";

/**
 * Manages git worktrees for isolated run execution.
 * Worktrees are named `attractor/<runId>` relative to the workspace root.
 */
export class GitWorktreeManager implements WorktreeManager {
  constructor(private readonly repoRoot: string) {}

  /**
   * Creates a new detached worktree at `<repoRoot>/../.attractor-worktrees/<runId>`.
   * Returns the absolute path to the worktree.
   */
  async allocate(runId: string): Promise<string> {
    const worktreePath = path.join(
      this.repoRoot,
      "..",
      ".attractor-worktrees",
      runId
    );
    execSync(`git worktree add --detach "${worktreePath}"`, {
      cwd: this.repoRoot,
      stdio: "pipe"
    });
    return worktreePath;
  }

  /**
   * Removes the worktree. If `retain` is true, the directory is kept on disk
   * (prune is still called to clean the git metadata).
   */
  async release(worktreePath: string, retain: boolean): Promise<void> {
    if (retain) {
      execSync(`git worktree prune`, { cwd: this.repoRoot, stdio: "pipe" });
    } else {
      execSync(`git worktree remove --force "${worktreePath}"`, {
        cwd: this.repoRoot,
        stdio: "pipe"
      });
    }
  }
}
