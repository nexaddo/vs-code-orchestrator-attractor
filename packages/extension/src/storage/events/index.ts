import { type ExtensionEvent } from "@attractor/shared";

/**
 * EventLog provides append-only storage for extension events scoped to a run.
 * Events are persisted in JSONL format at storage/runs/<run-id>/events.jsonl.
 */
export interface EventLog {
  /**
   * Append a single event to the log for its run.
   * Creates the parent directory and file if they do not exist.
   */
  append(event: ExtensionEvent): Promise<void>;

  /**
   * Return all events for a given run in append order.
   * Returns an empty array if no log exists for the run yet.
   * Throws if any line fails schema validation.
   */
  listByRun(runId: string): Promise<ExtensionEvent[]>;
}

export { FileEventLog } from "./file-event-log";
