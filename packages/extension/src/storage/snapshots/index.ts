import { type RunSnapshot } from "@attractor/shared";

/**
 * SnapshotProjector derives a read-model RunSnapshot by replaying the ordered
 * event stream for a run.  All projection is deterministic — given the same
 * ordered event sequence it always returns the same snapshot.
 *
 * M2 scope: no live subscriptions, no caching, no webview push.
 */
export interface SnapshotProjector {
  /**
   * Read all events for `runId` via the underlying EventLog and project them
   * into a RunSnapshot.  Returns null when no events have been recorded yet.
   */
  project(runId: string): Promise<RunSnapshot | null>;
}
