import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { RunRecoverySnapshot } from "@attractor/shared";

import { FileRunSnapshotStore } from "../../../src/infrastructure/storage/file-run-snapshot-store";

const validRunRecord = {
  version: 1 as const,
  id: "run-snap-01",
  planId: "plan-x",
  attempt: 1,
  status: "running" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:01:00.000Z"
};

describe("FileRunSnapshotStore", () => {
  let tmpDir: string;
  let store: FileRunSnapshotStore;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "attractor-snapshot-"));
    store = new FileRunSnapshotStore(tmpDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("saves and retrieves a snapshot", async () => {
    const snap: RunRecoverySnapshot = {
      version: 1,
      runId: "run-snap-01",
      lastEventIndex: 2,
      runRecord: validRunRecord
    };
    await store.save(snap);
    const found = await store.find("run-snap-01");
    expect(found).toBeDefined();
    expect(found?.runId).toBe("run-snap-01");
    expect(found?.lastEventIndex).toBe(2);
    expect(found?.runRecord.status).toBe("running");
  });

  it("returns undefined for unknown runId", async () => {
    const result = await store.find("no-such-run");
    expect(result).toBeUndefined();
  });

  it("overwrites an existing snapshot", async () => {
    const snap1: RunRecoverySnapshot = {
      version: 1,
      runId: "run-snap-01",
      lastEventIndex: 1,
      runRecord: validRunRecord
    };
    const snap2: RunRecoverySnapshot = {
      version: 1,
      runId: "run-snap-01",
      lastEventIndex: 5,
      runRecord: { ...validRunRecord, status: "completed" }
    };
    await store.save(snap1);
    await store.save(snap2);
    const found = await store.find("run-snap-01");
    expect(found?.lastEventIndex).toBe(5);
    expect(found?.runRecord.status).toBe("completed");
  });

  it("persists to .attractor/runs/<runId>/snapshot.json", async () => {
    const snap: RunRecoverySnapshot = {
      version: 1,
      runId: "run-snap-01",
      lastEventIndex: 0,
      runRecord: validRunRecord
    };
    await store.save(snap);
    const filePath = path.join(
      tmpDir,
      ".attractor",
      "runs",
      "run-snap-01",
      "snapshot.json"
    );
    const raw = await fs.readFile(filePath, "utf8");
    const parsed: unknown = JSON.parse(raw);
    expect(parsed).toMatchObject({ version: 1, runId: "run-snap-01" });
  });
});
