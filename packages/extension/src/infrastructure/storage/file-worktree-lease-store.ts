import * as fs from "fs/promises";
import * as path from "path";

import {
  WorktreeLeaseStoreRecordSchema,
  type WorktreeLease,
  type WorktreeLeaseStatus,
  type WorktreeLeaseStoreRecord
} from "@attractor/shared";

import type { WorktreeLeaseStore } from "../../application/ports";

const CONTRACT_VERSION = 1 as const;

/**
 * Persists worktree leases to `.attractor/worktrees/leases.json`.
 */
export class FileWorktreeLeaseStore implements WorktreeLeaseStore {
  constructor(private readonly root: string) {}

  private leasesPath(): string {
    return path.join(this.root, ".attractor", "worktrees", "leases.json");
  }

  private async readStore(): Promise<WorktreeLeaseStoreRecord> {
    try {
      const raw = await fs.readFile(this.leasesPath(), "utf8");
      const parsed: unknown = JSON.parse(raw);
      return WorktreeLeaseStoreRecordSchema.parse(parsed);
    } catch {
      return { version: CONTRACT_VERSION, leases: [] };
    }
  }

  private async writeStore(store: WorktreeLeaseStoreRecord): Promise<void> {
    const dir = path.dirname(this.leasesPath());
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      this.leasesPath(),
      JSON.stringify(store, null, 2),
      "utf8"
    );
  }

  async allocate(runId: string, worktreePath: string): Promise<WorktreeLease> {
    const store = await this.readStore();
    const existing = store.leases.find((l) => l.runId === runId);
    if (existing !== undefined) {
      return existing;
    }
    const now = new Date().toISOString();
    const lease: WorktreeLease = {
      version: CONTRACT_VERSION,
      runId,
      worktreePath,
      status: "allocated",
      createdAt: now,
      updatedAt: now
    };
    store.leases.push(lease);
    await this.writeStore(store);
    return lease;
  }

  async updateStatus(
    runId: string,
    status: WorktreeLeaseStatus
  ): Promise<void> {
    const store = await this.readStore();
    const lease = store.leases.find((l) => l.runId === runId);
    if (lease === undefined) {
      throw new Error(`No lease found for runId: ${runId}`);
    }
    lease.status = status;
    lease.updatedAt = new Date().toISOString();
    await this.writeStore(store);
  }

  async findByRunId(runId: string): Promise<WorktreeLease | undefined> {
    const store = await this.readStore();
    return store.leases.find((l) => l.runId === runId);
  }

  async release(runId: string): Promise<void> {
    const store = await this.readStore();
    store.leases = store.leases.filter((l) => l.runId !== runId);
    await this.writeStore(store);
  }

  async listAll(): Promise<WorktreeLease[]> {
    const store = await this.readStore();
    return store.leases;
  }
}
