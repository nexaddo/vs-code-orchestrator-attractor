import type {
  EventEnvelope,
  RunRecord,
  RunRecoverySnapshot
} from "@attractor/shared";
import { CONTRACT_VERSION } from "@attractor/shared";

/**
 * Domain aggregate that wraps a RunRecord and applies domain events to it.
 *
 * Use RunAggregate.create() for a fresh run, RunAggregate.fromSnapshot() to
 * restore from a persisted snapshot + tail events, or RunAggregate.fromFullReplay()
 * when no snapshot exists and the full event log must be replayed.
 */
export class RunAggregate {
  private _record: RunRecord;

  private constructor(record: RunRecord) {
    this._record = { ...record };
  }

  /** Wrap an existing RunRecord without applying any events. */
  static create(record: RunRecord): RunAggregate {
    return new RunAggregate(record);
  }

  /**
   * Restore from a snapshot and apply any events that were appended after it.
   * @param snapshot  The last committed snapshot.
   * @param events    Events appended after snapshot.lastEventIndex (slice already performed by caller).
   */
  static fromSnapshot(
    snapshot: RunRecoverySnapshot,
    events: EventEnvelope[]
  ): RunAggregate {
    const agg = new RunAggregate(snapshot.runRecord);
    for (const event of events) {
      agg.applyEvent(event);
    }
    return agg;
  }

  /**
   * Fallback path when no snapshot is available: replay every event from scratch.
   */
  static fromFullReplay(
    initialRecord: RunRecord,
    events: EventEnvelope[]
  ): RunAggregate {
    const agg = new RunAggregate(initialRecord);
    for (const event of events) {
      agg.applyEvent(event);
    }
    return agg;
  }

  /** Apply a single domain event to update internal state. Unknown events are silently ignored. */
  applyEvent(event: EventEnvelope): void {
    const ts = event.timestamp;
    switch (event.name) {
      case "run.started":
        this._record = {
          ...this._record,
          status: "running",
          startedAt: ts,
          updatedAt: ts
        };
        break;
      case "run.completed":
        this._record = {
          ...this._record,
          status: "completed",
          completedAt: ts,
          updatedAt: ts
        };
        break;
      case "run.failed":
        this._record = { ...this._record, status: "failed", updatedAt: ts };
        break;
      case "run.canceled":
        this._record = { ...this._record, status: "canceled", updatedAt: ts };
        break;
      case "run.resumed":
        this._record = { ...this._record, updatedAt: ts };
        break;
      default:
        // Unknown events are no-ops; projection is forward-compatible.
        break;
    }
  }

  /**
   * Capture the current state as a snapshot at the given event log index.
   * @param lastEventIndex  0-based index of the last event applied (from EventLog.readAll()).
   */
  takeSnapshot(lastEventIndex: number): RunRecoverySnapshot {
    return {
      version: CONTRACT_VERSION,
      runId: this._record.id,
      lastEventIndex,
      runRecord: { ...this._record }
    };
  }

  /** Returns a defensive copy of the current run record. */
  get record(): RunRecord {
    return { ...this._record };
  }
}
