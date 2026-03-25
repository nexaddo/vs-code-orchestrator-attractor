import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { type ExtensionEvent } from "@attractor/shared";

import { FileEventLog } from "../../src/storage/events/file-event-log";
import { EventLogSnapshotProjector } from "../../src/storage/snapshots/snapshot-projector";

// This tests the integration between FileEventLog and SnapshotProjector
// which is NOT covered by file-event-log.test.ts (tests FileEventLog in isolation)
// or snapshot-projector.test.ts (tests projector with fixture data).
//
// Integration test validates the full event sourcing cycle:
// 1. Write events to disk via FileEventLog
// 2. Read events from disk via FileEventLog
// 3. Project snapshot from read events via SnapshotProjector

function makeEvent(overrides: Partial<ExtensionEvent> = {}): ExtensionEvent {
  return {
    version: 1 as const,
    id: "evt_001",
    runId: "run_abc",
    entityType: "run" as const,
    entityId: "run_abc",
    kind: "created" as const,
    timestamp: "2026-03-25T00:00:00.000Z",
    payload: {},
    ...overrides
  };
}

let tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.map((dir) => rm(dir, { recursive: true, force: true }))
  );
  tempDirs = [];
});

describe("Event sourcing integration — full cycle", () => {
  it("full cycle: append events → list by run → project snapshot", async () => {
    // This tests the complete event sourcing flow which is NOT covered by
    // file-event-log.test.ts (unit tests FileEventLog) or
    // snapshot-projector.test.ts (unit tests projector with stub EventLog).
    const root = await mkdtemp(
      path.join(os.tmpdir(), "attractor-integration-")
    );
    tempDirs.push(root);

    const eventLog = new FileEventLog(root);
    const projector = new EventLogSnapshotProjector(eventLog);

    const runId = "run_integration_001";

    // Append 5 events simulating a complete run lifecycle
    const events: ExtensionEvent[] = [
      makeEvent({
        id: "evt_start",
        runId,
        kind: "status.changed",
        payload: { status: "running" },
        timestamp: "2026-03-25T10:00:00.000Z"
      }),
      makeEvent({
        id: "evt_ms1_begin",
        runId,
        entityType: "milestone",
        entityId: "ms_001",
        kind: "created",
        timestamp: "2026-03-25T10:01:00.000Z"
      }),
      makeEvent({
        id: "evt_node_complete",
        runId,
        entityType: "run",
        entityId: runId,
        kind: "updated",
        timestamp: "2026-03-25T10:02:00.000Z"
      }),
      makeEvent({
        id: "evt_ms1_end",
        runId,
        entityType: "milestone",
        entityId: "ms_001",
        kind: "updated",
        timestamp: "2026-03-25T10:03:00.000Z"
      }),
      makeEvent({
        id: "evt_complete",
        runId,
        kind: "status.changed",
        payload: { status: "completed" },
        timestamp: "2026-03-25T10:04:00.000Z"
      })
    ];

    for (const event of events) {
      await eventLog.append(event);
    }

    // List events back from disk
    const listResult = await eventLog.listByRun(runId);
    expect(listResult).toHaveLength(5);
    expect(listResult.map((e) => e.id)).toEqual([
      "evt_start",
      "evt_ms1_begin",
      "evt_node_complete",
      "evt_ms1_end",
      "evt_complete"
    ]);

    // Project snapshot from the stored events
    const snapshot = await projector.project(runId);

    expect(snapshot).not.toBeNull();
    expect(snapshot?.runId).toBe(runId);
    expect(snapshot?.status).toBe("completed");
    expect(snapshot?.currentMilestoneId).toBe("ms_001");
    expect(snapshot?.snapshotAt).toBe("2026-03-25T10:04:00.000Z");
  });

  it("partial progress: snapshot shows running state with mixed milestone status", async () => {
    // This tests partial run progression which is NOT covered by
    // file-event-log.test.ts (isolated append/list) or
    // snapshot-projector.test.ts (controlled fixture data).
    const root = await mkdtemp(
      path.join(os.tmpdir(), "attractor-integration-")
    );
    tempDirs.push(root);

    const eventLog = new FileEventLog(root);
    const projector = new EventLogSnapshotProjector(eventLog);

    const runId = "run_partial_001";

    // Append events up to a partially completed state
    await eventLog.append(
      makeEvent({
        id: "evt_start",
        runId,
        kind: "status.changed",
        payload: { status: "running" },
        timestamp: "2026-03-25T11:00:00.000Z"
      })
    );

    await eventLog.append(
      makeEvent({
        id: "evt_ms1_complete",
        runId,
        entityType: "milestone",
        entityId: "ms_001",
        kind: "updated",
        timestamp: "2026-03-25T11:01:00.000Z"
      })
    );

    await eventLog.append(
      makeEvent({
        id: "evt_ms2_failed",
        runId,
        entityType: "milestone",
        entityId: "ms_002",
        kind: "updated",
        timestamp: "2026-03-25T11:02:00.000Z"
      })
    );

    await eventLog.append(
      makeEvent({
        id: "evt_paused",
        runId,
        kind: "status.changed",
        payload: { status: "paused" },
        timestamp: "2026-03-25T11:03:00.000Z"
      })
    );

    // Project snapshot
    const snapshot = await projector.project(runId);

    expect(snapshot).not.toBeNull();
    expect(snapshot?.runId).toBe(runId);
    expect(snapshot?.status).toBe("paused");
    expect(snapshot?.currentMilestoneId).toBe("ms_002");
    expect(snapshot?.snapshotAt).toBe("2026-03-25T11:03:00.000Z");
  });

  it("empty events: projector returns null for runs with no events", async () => {
    // This tests the edge case of empty event streams which is covered by
    // snapshot-projector.test.ts with a stub EventLog but NOT in an end-to-end
    // manner with actual disk-backed event log.
    const root = await mkdtemp(
      path.join(os.tmpdir(), "attractor-integration-")
    );
    tempDirs.push(root);

    const eventLog = new FileEventLog(root);
    const projector = new EventLogSnapshotProjector(eventLog);

    const runId = "run_empty_001";

    // Do NOT append any events — test empty log file scenario
    const snapshot = await projector.project(runId);

    expect(snapshot).toBeNull();
  });
});
