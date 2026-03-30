import * as fs from "fs/promises";
import * as path from "path";

import { EventEnvelopeSchema, type EventEnvelope } from "@attractor/shared";

import type { EventLog } from "../../application/ports";
import { assertSafeStorageId } from "../../storage/path-safety";

/**
 * Append-only NDJSON event log at `.attractor/runs/<runId>/events.ndjson`.
 */
export class NdjsonEventLog implements EventLog {
  constructor(private readonly root: string) {}

  private logPath(runId: string): string {
    assertSafeStorageId(runId, "Run id");
    return path.join(this.root, ".attractor", "runs", runId, "events.ndjson");
  }

  async append(runId: string, envelope: EventEnvelope): Promise<void> {
    const validated = EventEnvelopeSchema.parse(envelope);
    const logFile = this.logPath(runId);
    await fs.mkdir(path.dirname(logFile), { recursive: true });
    await fs.appendFile(logFile, JSON.stringify(validated) + "\n", "utf8");
  }

  /**
   * Read all events from the log. ENOENT (no log yet) is treated as an empty
   * list. JSON parse errors or schema validation failures bubble up so callers
   * can distinguish a corrupted log from a missing one.
   */
  async readAll(runId: string): Promise<EventEnvelope[]> {
    let raw: string;
    try {
      raw = await fs.readFile(this.logPath(runId), "utf8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw err;
    }

    const lines = raw.split("\n").filter((l) => l.trim().length > 0);
    return lines.map((line) => {
      const parsed: unknown = JSON.parse(line);
      return EventEnvelopeSchema.parse(parsed);
    });
  }
}
