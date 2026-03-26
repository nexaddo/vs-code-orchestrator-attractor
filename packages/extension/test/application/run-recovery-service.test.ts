import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { EventEnvelope, RunRecord } from "@attractor/shared";

import type { EventPublisher } from "../../src/application/ports";
import { RunRecoveryService } from "../../src/application/run-recovery-service";
import { FileRunRepository } from "../../src/infrastructure/storage/file-run-repository";
import { FileRunSnapshotStore } from "../../src/infrastructure/storage/file-run-snapshot-store";
import { NdjsonEventLog } from "../../src/infrastructure/storage/ndjson-event-log";

const baseRecord = (id: string, status: RunRecord["status"]): RunRecord => ({
  version: 1,
  id,
  planId: "plan-1",
  graphId: "graph-1",
  worktreeId: "wt-1",
  status,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
});

function makeEvent(
  runId: string,
  name: string,
  timestamp = "2026-01-01T00:01:00.000Z"
): EventEnvelope {
  return {
    version: 1,
    id: `evt-${name}-${runId}`,
    name,
    aggregateType: "run",
    aggregateId: runId,
    correlationId: "corr-1",
    timestamp,
    payload: {}
  };
}

describe("RunRecoveryService", () => {
  let tmpDir: string;
  let runRepo: FileRunRepository;
  let eventLog: NdjsonEventLog;
  let snapshotStore: FileRunSnapshotStore;
  let publisher: EventPublisher;
  let publishedEvents: EventEnvelope[];
  let service: RunRecoveryService;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "attractor-recovery-"));
    runRepo = new FileRunRepository(tmpDir);
    eventLog = new NdjsonEventLog(tmpDir);
    snapshotStore = new FileRunSnapshotStore(tmpDir);
    publishedEvents = [];
    publisher = {
      publish: vi.fn(async (ev) => {
        publishedEvents.push(ev as EventEnvelope);
      })
    };
    service = new RunRecoveryService(runRepo, eventLog, snapshotStore, publisher);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("returns empty array when no runs exist", async () => {
    const resumed = await service.recover();
    expect(resumed).toEqual([]);
  });

  it("skips completed and failed runs", async () => {
    await runRepo.save(baseRecord("run-done", "completed"));
    await runRepo.save(baseRecord("run-fail", "failed"));
    const resumed = await service.recover();
    expect(resumed).toEqual([]);
  });

  it("resumes a running run with no snapshot (full replay)", async () => {
    const runId = "run-interrupted";
    await runRepo.save(baseRecord(runId, "running"));
    await eventLog.append(runId, makeEvent(runId, "run.started"));

    const resumed = await service.recover();

    expect(resumed).toEqual([runId]);
    expect(publishedEvents).toHaveLength(1);
    expect(publishedEvents[0]?.name).toBe("run.resumed");
    expect(publishedEvents[0]?.aggregateId).toBe(runId);
  });

  it("emits run.resumed with correct resumedFromEventIndex", async () => {
    const runId = "run-with-events";
    await runRepo.save(baseRecord(runId, "running"));
    await eventLog.append(runId, makeEvent(runId, "run.started"));
    await eventLog.append(runId, makeEvent(runId, "run.started")); // 2 events, last index = 1

    const resumed = await service.recover();

    expect(resumed).toContain(runId);
    const resumedEvent = publishedEvents.find((e) => e.name === "run.resumed");
    expect(resumedEvent?.payload).toMatchObject({ resumedFromEventIndex: 1 });
  });

  it("resumes a running run with a snapshot (partial replay)", async () => {
    const runId = "run-with-snapshot";
    const runRecord = baseRecord(runId, "running");
    await runRepo.save(runRecord);
    // Two events before snapshot
    await eventLog.append(runId, makeEvent(runId, "run.started"));
    await eventLog.append(runId, makeEvent(runId, "run.resumed"));
    // Save snapshot at index 1
    await snapshotStore.save({
      version: 1,
      runId,
      lastEventIndex: 1,
      runRecord: { ...runRecord, status: "running" }
    });
    // One more event after snapshot
    await eventLog.append(runId, makeEvent(runId, "run.resumed"));

    const resumed = await service.recover();

    expect(resumed).toContain(runId);
    expect(publishedEvents.some((e) => e.name === "run.resumed")).toBe(true);
  });

  it("resumes multiple running runs", async () => {
    await runRepo.save(baseRecord("run-a", "running"));
    await runRepo.save(baseRecord("run-b", "running"));
    await eventLog.append("run-a", makeEvent("run-a", "run.started"));
    await eventLog.append("run-b", makeEvent("run-b", "run.started"));

    const resumed = await service.recover();

    expect(resumed.sort()).toEqual(["run-a", "run-b"]);
    expect(publishedEvents.filter((e) => e.name === "run.resumed")).toHaveLength(2);
  });

  it("appends run.resumed event to the event log", async () => {
    const runId = "run-log-check";
    await runRepo.save(baseRecord(runId, "running"));
    await eventLog.append(runId, makeEvent(runId, "run.started"));

    await service.recover();

    const events = await eventLog.readAll(runId);
    expect(events.some((e) => e.name === "run.resumed")).toBe(true);
  });
});
