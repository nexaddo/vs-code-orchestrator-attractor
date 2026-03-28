import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FileWorktreeLeaseStore } from "../../../src/infrastructure/storage";

describe("FileWorktreeLeaseStore", () => {
  let tmpDir: string;
  let store: FileWorktreeLeaseStore;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "attractor-lease-store-"));
    store = new FileWorktreeLeaseStore(tmpDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("allocates a new lease", async () => {
    const lease = await store.allocate("run-001", "/tmp/wt/run-001");
    expect(lease.runId).toBe("run-001");
    expect(lease.worktreePath).toBe("/tmp/wt/run-001");
    expect(lease.state).toBe("active");
  });

  it("returns existing lease if already allocated", async () => {
    const first = await store.allocate("run-dup", "/tmp/wt/dup");
    const second = await store.allocate("run-dup", "/tmp/wt/dup");
    expect(second.createdAt).toBe(first.createdAt);
  });

  it("finds a lease by runId", async () => {
    await store.allocate("run-002", "/tmp/wt/run-002");
    const found = await store.findByRunId("run-002");
    expect(found?.runId).toBe("run-002");
  });

  it("returns undefined for unknown runId", async () => {
    const found = await store.findByRunId("nope");
    expect(found).toBeUndefined();
  });

  it("releases a lease", async () => {
    await store.allocate("run-004", "/tmp/wt/run-004");
    await store.release("run-004");
    const found = await store.findByRunId("run-004");
    expect(found).toBeUndefined();
  });

  it("lists all active leases", async () => {
    await store.allocate("run-a", "/tmp/wt/a");
    await store.allocate("run-b", "/tmp/wt/b");
    const leases = await store.listAll();
    expect(leases).toHaveLength(2);
  });

  it("returns empty list initially", async () => {
    const leases = await store.listAll();
    expect(leases).toEqual([]);
  });

  it("released leases are excluded from listAll", async () => {
    await store.allocate("run-a", "/tmp/wt/a");
    await store.allocate("run-b", "/tmp/wt/b");
    await store.release("run-a");
    const leases = await store.listAll();
    expect(leases).toHaveLength(1);
    expect(leases[0]?.runId).toBe("run-b");
  });

  it("persists to .attractor/worktrees/leases.json", async () => {
    await store.allocate("run-005", "/tmp/wt/run-005");
    const filePath = path.join(
      tmpDir,
      ".attractor",
      "worktrees",
      "leases.json"
    );
    const raw = await fs.readFile(filePath, "utf8");
    const parsed: unknown = JSON.parse(raw);
    expect(parsed).toMatchObject({
      version: 1,
      leases: [{ runId: "run-005" }]
    });
  });
});
