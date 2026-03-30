import * as fs from "fs/promises";
import * as path from "path";

import type { WorktreeLease } from "@attractor/shared";

import type { WorktreeLeaseStore } from "../../application/ports";

/**
 * Self-contained on-disk format for leases.
 */
interface StoredLease {
  version: 1;
  runId: string;
  repositoryId: string;
  branchName: string;
  worktreePath: string;
  state: "active" | "released";
  createdAt: string;
  updatedAt: string;
}

interface StoredLeaseFile {
  version: 1;
  leases: StoredLease[];
}

const STORE_VERSION = 1 as const;

function toWorktreedLease(s: StoredLease): WorktreeLease {
  return {
    version: STORE_VERSION,
    id: s.runId,
    runId: s.runId,
    repositoryId: s.repositoryId,
    branchName: s.branchName,
    worktreePath: s.worktreePath,
    state: s.state === "active" ? "active" : "released",
    createdAt: s.createdAt,
    releasedAt: s.state === "released" ? s.updatedAt : undefined
  };
}

/**
 * Persists worktree leases to `.attractor/worktrees/leases.json`.
 */
export class FileWorktreeLeaseStore implements WorktreeLeaseStore {
  constructor(private readonly root: string) {}

  private leasesPath(): string {
    return path.join(this.root, ".attractor", "worktrees", "leases.json");
  }

  private async readStore(): Promise<StoredLeaseFile> {
    try {
      const raw = await fs.readFile(this.leasesPath(), "utf8");
      const parsed = JSON.parse(raw) as StoredLeaseFile;
      if (Array.isArray(parsed.leases)) {
        return parsed;
      }
      return { version: STORE_VERSION, leases: [] };
    } catch {
      return { version: STORE_VERSION, leases: [] };
    }
  }

  private async writeStore(store: StoredLeaseFile): Promise<void> {
    const dir = path.dirname(this.leasesPath());
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      this.leasesPath(),
      JSON.stringify(store, null, 2),
      "utf8"
    );
  }

  async findByRunId(runId: string): Promise<WorktreeLease | undefined> {
    const store = await this.readStore();
    const s = store.leases.find(
      (l) => l.runId === runId && l.state === "active"
    );
    return s !== undefined ? toWorktreedLease(s) : undefined;
  }

  async release(runId: string): Promise<void> {
    const store = await this.readStore();
    const lease = store.leases.find((l) => l.runId === runId);
    if (lease !== undefined) {
      lease.state = "released";
      lease.updatedAt = new Date().toISOString();
      await this.writeStore(store);
    }
  }

  async listAll(): Promise<WorktreeLease[]> {
    const store = await this.readStore();
    return store.leases
      .filter((l) => l.state === "active")
      .map(toWorktreedLease);
  }

  // Internal: used by tests and worktree wiring
  async allocate(
    runId: string,
    worktreePath: string,
    repositoryId: string,
    branchName: string
  ): Promise<WorktreeLease> {
    const store = await this.readStore();
    const existing = store.leases.find((l) => l.runId === runId);
    if (existing !== undefined) {
      return toWorktreedLease(existing);
    }
    const now = new Date().toISOString();
    const lease: StoredLease = {
      version: STORE_VERSION,
      runId,
      repositoryId,
      branchName,
      worktreePath,
      state: "active",
      createdAt: now,
      updatedAt: now
    };
    store.leases.push(lease);
    await this.writeStore(store);
    return toWorktreedLease(lease);
  }
}
