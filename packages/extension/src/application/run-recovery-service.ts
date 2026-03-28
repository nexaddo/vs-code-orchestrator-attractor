import type { EventEnvelope } from "@attractor/shared";
import { CONTRACT_VERSION } from "@attractor/shared";

import { RunAggregate } from "../domain/run-aggregate";
import type {
  EventLog,
  EventPublisher,
  RunRepository,
  RunSnapshotStore
} from "./ports";

/**
 * On extension restart, scans for runs left in `running` status and replays
 * their event log (from last snapshot if available) to restore in-flight state.
 * Only emits `run.resumed` for runs whose replayed status is still `running`.
 */
export class RunRecoveryService {
  constructor(
    private readonly runRepo: RunRepository,
    private readonly eventLog: EventLog,
    private readonly snapshotStore: RunSnapshotStore,
    private readonly publisher: EventPublisher
  ) {}

  /**
   * Recover all interrupted runs.
   * @returns List of run IDs that were resumed.
   */
  async recover(): Promise<string[]> {
    const allRuns = await this.runRepo.list();
    const interrupted = allRuns.filter((r) => r.status === "running");
    const resumed: string[] = [];

    for (const run of interrupted) {
      const events = await this.eventLog.readAll(run.id);
      const snapshot = await this.snapshotStore.find(run.id);

      // Replay events to derive current state
      let aggregate: RunAggregate;
      if (snapshot !== undefined) {
        // Partial replay: only apply events that arrived after the snapshot
        const tailEvents = events.slice(snapshot.lastEventIndex + 1);
        aggregate = RunAggregate.fromSnapshot(snapshot, tailEvents);
      } else {
        // Snapshot-missing fallback: replay every event from the initial record
        aggregate = RunAggregate.fromFullReplay(run, events);
      }

      // Only emit run.resumed when the derived status confirms the run is still resumable.
      // If replay indicates the run completed/failed/canceled before the crash, skip it.
      if (aggregate.record.status !== "running") {
        continue;
      }

      // -1 signals "no prior events" so downstream consumers can distinguish
      // an empty log from a log where index 0 was the last applied event.
      const lastEventIndex = events.length > 0 ? events.length - 1 : -1;

      // Emit run.resumed event
      const now = new Date().toISOString();
      const resumedEnvelope: EventEnvelope = {
        version: CONTRACT_VERSION,
        id: crypto.randomUUID(),
        name: "run.resumed",
        aggregateType: "run",
        aggregateId: run.id,
        correlationId: run.id,
        timestamp: now,
        payload: { resumedFromEventIndex: lastEventIndex }
      };

      await this.eventLog.append(run.id, resumedEnvelope);
      await this.publisher.publish({
        id: resumedEnvelope.id,
        name: resumedEnvelope.name,
        aggregateType: resumedEnvelope.aggregateType,
        aggregateId: resumedEnvelope.aggregateId,
        correlationId: resumedEnvelope.correlationId,
        timestamp: resumedEnvelope.timestamp,
        payload: resumedEnvelope.payload
      });

      resumed.push(run.id);
    }

    return resumed;
  }
}
