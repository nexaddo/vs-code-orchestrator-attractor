import fs from "node:fs";
import path from "node:path";

import { ExtensionEventSchema, type ExtensionEvent } from "@attractor/shared";

import { type EventLog } from "./index";

/**
 * File-backed EventLog implementation.
 *
 * Events are persisted as newline-delimited JSON (JSONL) at:
 *   <storageRoot>/runs/<runId>/events.jsonl
 *
 * Each call to `append` writes exactly one JSON line and flushes.
 * Each call to `listByRun` parses and validates every line; a malformed
 * or schema-invalid line causes an explicit Error rather than silent skipping.
 */
export class FileEventLog implements EventLog {
  constructor(private readonly storageRoot: string) {}

  private logPath(runId: string): string {
    return path.join(this.storageRoot, "runs", runId, "events.jsonl");
  }

  async append(event: ExtensionEvent): Promise<void> {
    if (!event.runId) {
      throw new Error(
        `EventLog.append: event "${event.id}" has no runId — cannot determine log path`
      );
    }
    const filePath = this.logPath(event.runId);
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    const line = JSON.stringify(event) + "\n";
    await fs.promises.appendFile(filePath, line, "utf-8");
  }

  async listByRun(runId: string): Promise<ExtensionEvent[]> {
    const filePath = this.logPath(runId);
    let content: string;
    try {
      content = await fs.promises.readFile(filePath, "utf-8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw err;
    }

    const lines = content.split("\n").filter((l) => l.trim() !== "");
    const events: ExtensionEvent[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === undefined) continue;

      let parsed: unknown;
      try {
        parsed = JSON.parse(line);
      } catch {
        throw new Error(
          `EventLog[${runId}] line ${i + 1}: invalid JSON — ${line.slice(0, 80)}`
        );
      }

      const result = ExtensionEventSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(
          `EventLog[${runId}] line ${i + 1}: schema validation failed — ${result.error.message}`
        );
      }

      events.push(result.data);
    }

    return events;
  }
}
