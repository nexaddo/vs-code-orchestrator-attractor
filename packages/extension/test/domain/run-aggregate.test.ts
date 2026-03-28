import { describe, expect, it } from "vitest";

import type { EventEnvelope, RunRecord, RunRecoverySnapshot } from "@attractor/shared";

import { RunAggregate } from "../../src/domain/run-aggregate";

const baseRecord: RunRecord = {
  version: 1,
  id: "run-001",
  planId: "plan-1",
  attempt: 1,
  status: "queued",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

function makeEvent(
  name: string,
  timestamp = "2026-01-01T00:01:00.000Z",
  payload: Record<string, unknown> = {}
): EventEnvelope {
  return {
    version: 1,
    id: `evt-${name}`,
    name,
    aggregateType: "run",
    aggregateId: "run-001",
    correlationId: "corr-1",
    timestamp,
    payload
  };
}

describe("RunAggregate.create", () => {
  it("wraps a RunRecord and exposes it via .record", () => {
    const agg = RunAggregate.create(baseRecord);
    expect(agg.record).toEqual(baseRecord);
  });

  it("returns a defensive copy from .record", () => {
    const agg = RunAggregate.create(baseRecord);
    expect(agg.record).not.toBe(baseRecord);
  });
});

describe("RunAggregate.applyEvent", () => {
  it("transitions to running on run.started", () => {
    const agg = RunAggregate.create(baseRecord);
    agg.applyEvent(makeEvent("run.started", "2026-01-01T00:01:00.000Z"));
    expect(agg.record.status).toBe("running");
    expect(agg.record.startedAt).toBe("2026-01-01T00:01:00.000Z");
  });

  it("transitions to completed on run.completed", () => {
    const agg = RunAggregate.create({ ...baseRecord, status: "running" });
    agg.applyEvent(makeEvent("run.completed", "2026-01-01T00:05:00.000Z"));
    expect(agg.record.status).toBe("completed");
    expect(agg.record.completedAt).toBe("2026-01-01T00:05:00.000Z");
  });

  it("transitions to failed on run.failed", () => {
    const agg = RunAggregate.create({ ...baseRecord, status: "running" });
    agg.applyEvent(makeEvent("run.failed"));
    expect(agg.record.status).toBe("failed");
  });

  it("transitions to canceled on run.canceled", () => {
    const agg = RunAggregate.create({ ...baseRecord, status: "running" });
    agg.applyEvent(makeEvent("run.canceled"));
    expect(agg.record.status).toBe("canceled");
  });

  it("updates updatedAt on run.resumed without changing status", () => {
    const agg = RunAggregate.create({ ...baseRecord, status: "running" });
    agg.applyEvent(
      makeEvent("run.resumed", "2026-01-02T00:00:00.000Z", {
        resumedFromEventIndex: 3
      })
    );
    expect(agg.record.status).toBe("running");
    expect(agg.record.updatedAt).toBe("2026-01-02T00:00:00.000Z");
  });

  it("ignores unknown event names without throwing", () => {
    const agg = RunAggregate.create(baseRecord);
    expect(() => agg.applyEvent(makeEvent("some.unknown.event"))).not.toThrow();
  });
});

describe("RunAggregate.takeSnapshot", () => {
  it("returns a snapshot with the current run record and event index", () => {
    const agg = RunAggregate.create(baseRecord);
    agg.applyEvent(makeEvent("run.started"));
    const snap = agg.takeSnapshot(0);
    expect(snap.version).toBe(1);
    expect(snap.runId).toBe("run-001");
    expect(snap.lastEventIndex).toBe(0);
    expect(snap.runRecord.status).toBe("running");
  });

  it("snapshot runRecord is a defensive copy", () => {
    const agg = RunAggregate.create(baseRecord);
    const snap = agg.takeSnapshot(0);
    expect(snap.runRecord).not.toBe(agg.record);
  });
});

describe("RunAggregate.fromSnapshot — clean resume", () => {
  it("restores state from snapshot with no additional events", () => {
    const snapshot: RunRecoverySnapshot = {
      version: 1,
      runId: "run-001",
      lastEventIndex: 1,
      runRecord: { ...baseRecord, status: "running" }
    };
    const agg = RunAggregate.fromSnapshot(snapshot, []);
    expect(agg.record.status).toBe("running");
  });

  it("applies events that arrived after the snapshot", () => {
    const snapshot: RunRecoverySnapshot = {
      version: 1,
      runId: "run-001",
      lastEventIndex: 1,
      runRecord: { ...baseRecord, status: "running" }
    };
    const agg = RunAggregate.fromSnapshot(snapshot, [
      makeEvent("run.completed", "2026-01-01T00:10:00.000Z")
    ]);
    expect(agg.record.status).toBe("completed");
  });
});

describe("RunAggregate.fromSnapshot — partial replay (snapshot-missing fallback)", () => {
  it("reconstructs state from full event list when no snapshot provided", () => {
    const events: EventEnvelope[] = [
      makeEvent("run.started", "2026-01-01T00:01:00.000Z"),
      makeEvent("run.completed", "2026-01-01T00:05:00.000Z")
    ];
    const agg = RunAggregate.fromFullReplay(baseRecord, events);
    expect(agg.record.status).toBe("completed");
    expect(agg.record.startedAt).toBe("2026-01-01T00:01:00.000Z");
    expect(agg.record.completedAt).toBe("2026-01-01T00:05:00.000Z");
  });

  it("returns queued status when event log is empty", () => {
    const agg = RunAggregate.fromFullReplay(baseRecord, []);
    expect(agg.record.status).toBe("queued");
  });
});
