import { describe, expect, it } from "vitest";

import { type ExtensionEvent } from "@attractor/shared";

import { type EventLog } from "../../../src/storage/events/index";
import { EventLogSnapshotProjector } from "../../../src/storage/snapshots/snapshot-projector";

/** Minimal stub EventLog that returns a fixed event list. */
function makeEventLog(events: ExtensionEvent[]): EventLog {
  return {
    async append() {
      /* no-op */
    },
    async listByRun() {
      return events;
    }
  };
}

function makeEvent(overrides: Partial<ExtensionEvent> = {}): ExtensionEvent {
  return {
    version: 1 as const,
    id: "evt_001",
    runId: "run_abc",
    entityType: "run" as const,
    entityId: "run_abc",
    kind: "created" as const,
    timestamp: "2026-03-17T00:00:00.000Z",
    payload: {},
    ...overrides
  };
}

describe("EventLogSnapshotProjector", () => {
  describe("project — no events", () => {
    it("returns null when no events have been recorded", async () => {
      const projector = new EventLogSnapshotProjector(makeEventLog([]));
      const snapshot = await projector.project("run_empty");
      expect(snapshot).toBeNull();
    });
  });

  describe("project — status projection", () => {
    it("reflects the last status.changed event", async () => {
      const events: ExtensionEvent[] = [
        makeEvent({
          id: "e1",
          kind: "status.changed",
          payload: { status: "running" }
        }),
        makeEvent({
          id: "e2",
          kind: "status.changed",
          payload: { status: "paused" }
        })
      ];
      const projector = new EventLogSnapshotProjector(makeEventLog(events));
      const snapshot = await projector.project("run_abc");
      expect(snapshot?.status).toBe("paused");
    });

    it("ignores a status.changed event with unrecognized status value", async () => {
      const events: ExtensionEvent[] = [
        makeEvent({
          id: "e1",
          kind: "status.changed",
          payload: { status: "running" }
        }),
        makeEvent({
          id: "e2",
          kind: "status.changed",
          payload: { status: "not-a-valid-status" }
        })
      ];
      const projector = new EventLogSnapshotProjector(makeEventLog(events));
      const snapshot = await projector.project("run_abc");
      // Should keep last valid status, not the unrecognized one
      expect(snapshot?.status).toBe("running");
    });
  });

  describe("project — milestone projection", () => {
    it("tracks the last milestone entity event", async () => {
      const events: ExtensionEvent[] = [
        makeEvent({
          id: "e1",
          entityType: "milestone",
          entityId: "ms_001",
          kind: "created"
        }),
        makeEvent({
          id: "e2",
          entityType: "milestone",
          entityId: "ms_002",
          kind: "updated"
        })
      ];
      const projector = new EventLogSnapshotProjector(makeEventLog(events));
      const snapshot = await projector.project("run_abc");
      expect(snapshot?.currentMilestoneId).toBe("ms_002");
    });

    it("returns null currentMilestoneId when no milestone events exist", async () => {
      const events: ExtensionEvent[] = [
        makeEvent({ id: "e1", kind: "created" })
      ];
      const projector = new EventLogSnapshotProjector(makeEventLog(events));
      const snapshot = await projector.project("run_abc");
      expect(snapshot?.currentMilestoneId).toBeNull();
    });
  });

  describe("project — checkpoint projection", () => {
    it("tracks the last checkpoint.saved entityId", async () => {
      const events: ExtensionEvent[] = [
        makeEvent({
          id: "e1",
          kind: "checkpoint.saved",
          entityId: "cp_001"
        }),
        makeEvent({
          id: "e2",
          kind: "checkpoint.saved",
          entityId: "cp_002"
        })
      ];
      const projector = new EventLogSnapshotProjector(makeEventLog(events));
      const snapshot = await projector.project("run_abc");
      expect(snapshot?.lastCheckpointId).toBe("cp_002");
    });

    it("returns null lastCheckpointId when no checkpoint events exist", async () => {
      const events: ExtensionEvent[] = [
        makeEvent({ id: "e1", kind: "created" })
      ];
      const projector = new EventLogSnapshotProjector(makeEventLog(events));
      const snapshot = await projector.project("run_abc");
      expect(snapshot?.lastCheckpointId).toBeNull();
    });
  });

  describe("project — schema validity", () => {
    it("returns a schema-valid RunSnapshot", async () => {
      const events: ExtensionEvent[] = [
        makeEvent({
          id: "e1",
          kind: "status.changed",
          payload: { status: "completed" }
        })
      ];
      const projector = new EventLogSnapshotProjector(makeEventLog(events));
      const snapshot = await projector.project("run_abc");
      expect(snapshot?.version).toBe(1);
      expect(snapshot?.runId).toBe("run_abc");
      expect(typeof snapshot?.snapshotAt).toBe("string");
    });

    it("is deterministic — same event sequence always produces same snapshot", async () => {
      const events: ExtensionEvent[] = [
        makeEvent({
          id: "e1",
          kind: "status.changed",
          payload: { status: "running" }
        }),
        makeEvent({
          id: "e2",
          entityType: "milestone",
          entityId: "ms_001",
          kind: "created"
        }),
        makeEvent({
          id: "e3",
          kind: "checkpoint.saved",
          entityId: "cp_001"
        })
      ];
      const projector = new EventLogSnapshotProjector(makeEventLog(events));
      const snap1 = await projector.project("run_abc");
      const snap2 = await projector.project("run_abc");
      expect(snap1).toEqual(snap2);
    });
  });
});
