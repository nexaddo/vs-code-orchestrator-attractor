import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { FileEventLog } from "../../../src/storage/events/file-event-log";

const eventLogPath = (root: string, runId: string): string =>
  path.join(root, "storage", "runs", runId, "events.jsonl");

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    version: 1 as const,
    id: "evt_001",
    runId: "run_abc",
    entityType: "run" as const,
    entityId: "run_abc",
    kind: "status.changed" as const,
    timestamp: "2026-03-17T00:00:00.000Z",
    payload: {},
    ...overrides
  };
}

describe("FileEventLog", () => {
  describe("listByRun — empty log", () => {
    it("returns an empty array when no log file exists", async () => {
      const root = await mkdtemp(path.join(os.tmpdir(), "attractor-evtlog-"));
      try {
        const log = new FileEventLog(root);
        const events = await log.listByRun("run_nonexistent");
        expect(events).toEqual([]);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });
  });

  describe("append", () => {
    it("creates parent directories and file on first append", async () => {
      const root = await mkdtemp(path.join(os.tmpdir(), "attractor-evtlog-"));
      try {
        const log = new FileEventLog(root);
        const event = makeEvent();
        await log.append(event);

        const events = await log.listByRun("run_abc");
        expect(events).toHaveLength(1);
        expect(events[0]?.id).toBe("evt_001");
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });

    it("appends exactly one line per call", async () => {
      const root = await mkdtemp(path.join(os.tmpdir(), "attractor-evtlog-"));
      try {
        const log = new FileEventLog(root);
        await log.append(makeEvent({ id: "evt_001" }));
        await log.append(makeEvent({ id: "evt_002" }));
        await log.append(makeEvent({ id: "evt_003" }));

        const events = await log.listByRun("run_abc");
        expect(events).toHaveLength(3);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });

    it("throws when event has no runId", async () => {
      const root = await mkdtemp(path.join(os.tmpdir(), "attractor-evtlog-"));
      try {
        const log = new FileEventLog(root);
        const event = makeEvent({ runId: undefined });
        await expect(log.append(event)).rejects.toThrow(/no runId/);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });
  });

  describe("listByRun — multiple appends in order", () => {
    it("returns events in append order", async () => {
      const root = await mkdtemp(path.join(os.tmpdir(), "attractor-evtlog-"));
      try {
        const log = new FileEventLog(root);
        const ids = ["evt_a", "evt_b", "evt_c", "evt_d"];
        for (const id of ids) {
          await log.append(makeEvent({ id }));
        }

        const events = await log.listByRun("run_abc");
        expect(events.map((e) => e.id)).toEqual(ids);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });

    it("keeps runs isolated from each other", async () => {
      const root = await mkdtemp(path.join(os.tmpdir(), "attractor-evtlog-"));
      try {
        const log = new FileEventLog(root);
        await log.append(makeEvent({ id: "evt_run1", runId: "run_001" }));
        await log.append(makeEvent({ id: "evt_run2", runId: "run_002" }));

        const run1Events = await log.listByRun("run_001");
        const run2Events = await log.listByRun("run_002");

        expect(run1Events.map((e) => e.id)).toEqual(["evt_run1"]);
        expect(run2Events.map((e) => e.id)).toEqual(["evt_run2"]);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });
  });

  describe("listByRun — malformed line rejection", () => {
    it("throws on a line with invalid JSON", async () => {
      const root = await mkdtemp(path.join(os.tmpdir(), "attractor-evtlog-"));
      try {
        const log = new FileEventLog(root);
        // Append a valid event, then corrupt the file
        await log.append(makeEvent({ id: "evt_valid" }));
        const { writeFile } = await import("node:fs/promises");
        const filePath = eventLogPath(root, "run_abc");
        await writeFile(filePath, `not-json\n{"id":"evt_valid"}\n`);

        await expect(log.listByRun("run_abc")).rejects.toThrow(/invalid JSON/);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });

    it("throws on a line that fails schema validation", async () => {
      const root = await mkdtemp(path.join(os.tmpdir(), "attractor-evtlog-"));
      try {
        const log = new FileEventLog(root);
        await log.append(makeEvent({ id: "evt_valid" }));
        const { writeFile } = await import("node:fs/promises");
        const filePath = eventLogPath(root, "run_abc");
        // Write a line that is valid JSON but fails ExtensionEventSchema
        await writeFile(
          filePath,
          `${JSON.stringify(makeEvent({ id: "evt_valid" }))}\n{"broken":true}\n`
        );

        await expect(log.listByRun("run_abc")).rejects.toThrow(
          /schema validation failed/
        );
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });

    it("throws when a parsed event belongs to a different run", async () => {
      const root = await mkdtemp(path.join(os.tmpdir(), "attractor-evtlog-"));
      try {
        const log = new FileEventLog(root);
        await log.append(makeEvent({ id: "evt_valid" }));
        const { writeFile } = await import("node:fs/promises");
        const filePath = eventLogPath(root, "run_abc");
        await writeFile(
          filePath,
          `${JSON.stringify(makeEvent({ id: "evt_other", runId: "run_other" }))}\n`
        );

        await expect(log.listByRun("run_abc")).rejects.toThrow(
          /runId mismatch/
        );
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });
  });
});
