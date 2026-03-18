import * as fs from "fs/promises";
import * as path from "path";

import { EventEnvelopeSchema, type EventEnvelope } from "@attractor/shared";

import type { EventLog } from "../../application/ports";

/**
 * Append-only NDJSON event log at `.attractor/runs/<runId>/events.ndjson`.
 */
export class NdjsonEventLog implements EventLog {
  constructor(private readonly root: string) {}

  private logPath(runId: string): string {
    return path.join(this.root, ".attractor", "runs", runId, "events.ndjson");
  }

  async append(runId: string, envelope: EventEnvelope): Promise<void> {
    const logFile = this.logPath(runId);
    await fs.mkdir(path.dirname(logFile), { recursive: true });
    await fs.appendFile(logFile, JSON.stringify(envelope) + "\n", "utf8");
  }

  async readAll(runId: string): Promise<EventEnvelope[]> {
    try {
      const raw = await fs.readFile(this.logPath(runId), "utf8");
      const lines = raw.split("\n").filter((l) => l.trim().length > 0);
      return lines.map((line) => {
        const parsed: unknown = JSON.parse(line);
        return EventEnvelopeSchema.parse(parsed);
      });
    } catch {
      return [];
    }
  }
}
