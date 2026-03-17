import {
  RunSnapshotSchema,
  type ExtensionEvent,
  type RunSnapshot
} from "@attractor/shared";

import { type EventLog } from "../events/index";
import { type SnapshotProjector } from "./index";

/**
 * Projects a RunSnapshot by replaying an ordered event stream from EventLog.
 *
 * Projection rules (M2):
 *   - Last `status.changed` event sets `status`.
 *   - Last `milestone`-entity event with entityType === "milestone" sets `currentMilestoneId`.
 *   - Last `checkpoint.saved` event sets `lastCheckpointId` (entityId of the event).
 *   - When no events exist, returns null.
 *
 * No caching, no live subscriptions — pure deterministic replay.
 */
export class EventLogSnapshotProjector implements SnapshotProjector {
  constructor(private readonly eventLog: EventLog) {}

  async project(runId: string): Promise<RunSnapshot | null> {
    const events = await this.eventLog.listByRun(runId);

    if (events.length === 0) {
      return null;
    }

    let status: RunSnapshot["status"] = "queued";
    let currentMilestoneId: string | null = null;
    let lastCheckpointId: string | null = null;
    let snapshotAt = events[0]!.timestamp;

    for (const event of events) {
      snapshotAt = event.timestamp;

      if (event.kind === "status.changed") {
        // Extract the new status from payload if present, else leave unchanged
        const newStatus = extractStatus(event);
        if (newStatus !== null) {
          status = newStatus;
        }
      }

      if (event.entityType === "milestone") {
        currentMilestoneId = event.entityId;
      }

      if (event.kind === "checkpoint.saved") {
        lastCheckpointId = event.entityId;
      }
    }

    return RunSnapshotSchema.parse({
      version: 1,
      runId,
      status,
      currentMilestoneId,
      lastCheckpointId,
      snapshotAt
    });
  }
}

/**
 * Safely extract `status` from a `status.changed` event payload.
 * Returns null if the payload doesn't carry a recognized status string.
 */
function extractStatus(event: ExtensionEvent): RunSnapshot["status"] | null {
  const raw = event.payload["status"];
  const valid: RunSnapshot["status"][] = [
    "queued",
    "running",
    "paused",
    "completed",
    "failed",
    "canceled"
  ];
  if (typeof raw === "string" && (valid as string[]).includes(raw)) {
    return raw as RunSnapshot["status"];
  }
  return null;
}
