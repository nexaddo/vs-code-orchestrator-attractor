import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

import type { EventEnvelope } from "@attractor/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { NdjsonEventLog } from "../../../src/infrastructure/storage";

const makeEnvelope = (id: string, name: string): EventEnvelope => ({
  version: 1,
  id,
  name,
  aggregateType: "run",
  aggregateId: "run-001",
  correlationId: "corr-001",
  timestamp: "2026-01-01T00:00:00.000Z",
  payload: { planId: "plan-1" }
});

describe("NdjsonEventLog", () => {
  let tmpDir: string;
  let log: NdjsonEventLog;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "attractor-event-log-"));
    log = new NdjsonEventLog(tmpDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("appends and reads back a single event", async () => {
    const env = makeEnvelope("evt-001", "RunCreated");
    await log.append("run-001", env);
    const events = await log.readAll("run-001");
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(env);
  });

  it("appends multiple events in order", async () => {
    await log.append("run-002", makeEnvelope("e1", "RunCreated"));
    await log.append("run-002", makeEnvelope("e2", "RunStarted"));
    await log.append("run-002", makeEnvelope("e3", "RunCompleted"));
    const events = await log.readAll("run-002");
    expect(events).toHaveLength(3);
    expect(events.map((e) => e.name)).toEqual([
      "RunCreated",
      "RunStarted",
      "RunCompleted"
    ]);
  });

  it("returns empty array for unknown runId", async () => {
    const events = await log.readAll("nonexistent");
    expect(events).toEqual([]);
  });

  it("isolates events by runId", async () => {
    await log.append("run-A", makeEnvelope("e-a", "EventA"));
    await log.append("run-B", makeEnvelope("e-b", "EventB"));
    const eventsA = await log.readAll("run-A");
    const eventsB = await log.readAll("run-B");
    expect(eventsA).toHaveLength(1);
    expect(eventsB).toHaveLength(1);
    expect(eventsA[0]?.name).toBe("EventA");
    expect(eventsB[0]?.name).toBe("EventB");
  });

  it("persists to .attractor/runs/<runId>/events.ndjson", async () => {
    await log.append("run-003", makeEnvelope("e1", "RunCreated"));
    const filePath = path.join(
      tmpDir,
      ".attractor",
      "runs",
      "run-003",
      "events.ndjson"
    );
    const raw = await fs.readFile(filePath, "utf8");
    const lines = raw.trim().split("\n");
    expect(lines).toHaveLength(1);
    const parsed: unknown = JSON.parse(lines[0] ?? "");
    expect(parsed).toMatchObject({ name: "RunCreated" });
  });
});
