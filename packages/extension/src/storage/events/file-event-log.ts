import fs from "node:fs";
import path from "node:path";

import { ExtensionEventSchema, type ExtensionEvent } from "@attractor/shared";

import { type EventLog } from "./index";

const RUNS_DIRECTORY = path.join("storage", "runs");
const WINDOWS_RESERVED_NAMES = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])[. ]*$/i;

const assertSafeRunId = (id: string): void => {
  if (!id) {
    throw new Error("Run id must not be empty");
  }
  if (id.includes("/") || id.includes("\\")) {
    throw new Error(`Run id must not contain path separators: ${id}`);
  }
  if (id.includes(":")) {
    throw new Error(`Run id must not contain a colon: ${id}`);
  }
  if (id.includes("\0")) {
    throw new Error(`Run id must not contain null bytes: ${id}`);
  }
  if (WINDOWS_RESERVED_NAMES.test(id)) {
    throw new Error(`Run id is a reserved filename on Windows: ${id}`);
  }
};

/**
 * File-backed EventLog implementation.
 *
 * Events are persisted as newline-delimited JSON (JSONL) at:
 *   <storageRoot>/storage/runs/<runId>/events.jsonl
 *
 * Each call to `append` writes exactly one JSON line.
 * Each call to `listByRun` parses and validates every line; a malformed
 * or schema-invalid line causes an explicit Error rather than silent skipping.
 */
export class FileEventLog implements EventLog {
  constructor(private readonly storageRoot: string) {}

  private logPath(runId: string): string {
    assertSafeRunId(runId);
    return path.join(this.storageRoot, RUNS_DIRECTORY, runId, "events.jsonl");
  }

  async append(event: ExtensionEvent): Promise<void> {
    const parsedEvent = ExtensionEventSchema.parse(event);
    if (!parsedEvent.runId) {
      throw new Error(
        `EventLog.append: event "${parsedEvent.id}" has no runId — cannot determine log path`
      );
    }
    const filePath = this.logPath(parsedEvent.runId);
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    const line = JSON.stringify(parsedEvent) + "\n";
    await fs.promises.appendFile(filePath, line, "utf8");
  }

  async listByRun(runId: string): Promise<ExtensionEvent[]> {
    const filePath = this.logPath(runId);
    let content: string;
    try {
      content = await fs.promises.readFile(filePath, "utf8");
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
      } catch (error) {
        throw new Error(`EventLog[${runId}] line ${i + 1}: invalid JSON`, {
          cause: error
        });
      }

      const result = ExtensionEventSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(
          `EventLog[${runId}] line ${i + 1}: schema validation failed — ${result.error.message}`
        );
      }

      if (result.data.runId !== runId) {
        throw new Error(
          `EventLog[${runId}] line ${i + 1}: event runId mismatch (${result.data.runId ?? "missing"})`
        );
      }

      events.push(result.data);
    }

    return events;
  }
}
