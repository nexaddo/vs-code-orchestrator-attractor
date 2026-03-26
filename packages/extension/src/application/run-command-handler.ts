import type { RunRecord } from "@attractor/shared";

import { RunAggregate, makeRunId, makeWorktreeId } from "../domain";
import type {
  EventLog,
  EventPublisher,
  RunRepository,
  RunSnapshotStore,
  WorktreeLeaseStore,
  WorktreeManager
} from "./ports";

export interface StartRunCommand {
  readonly planId: string;
  readonly graphId: string;
  readonly correlationId: string;
}

export class RunCommandHandler {
  constructor(
    private readonly publisher: EventPublisher,
    private readonly runRepo: RunRepository,
    private readonly eventLog: EventLog,
    private readonly leaseStore: WorktreeLeaseStore,
    private readonly worktreeManager: WorktreeManager,
    private readonly snapshotStore?: RunSnapshotStore
  ) {}

  async startRun(command: StartRunCommand): Promise<RunRecord> {
    const runId = makeRunId(crypto.randomUUID());
    const now = new Date().toISOString();

    // Allocate worktree
    const worktreePath = await this.worktreeManager.allocate(runId);
    const worktreeId = makeWorktreeId(runId);

    // Register lease
    await this.leaseStore.allocate(runId, worktreePath);
    await this.leaseStore.updateStatus(runId, "preparing");

    // Persist run record
    const run: RunRecord = {
      version: 1,
      id: runId,
      planId: command.planId,
      graphId: command.graphId,
      worktreeId,
      status: "queued",
      createdAt: now,
      updatedAt: now
    };
    await this.runRepo.save(run);

    // Emit domain event
    const envelope = {
      version: 1 as const,
      id: crypto.randomUUID(),
      name: "RunCreated",
      aggregateType: "run",
      aggregateId: runId,
      correlationId: command.correlationId,
      timestamp: now,
      payload: { planId: command.planId, graphId: command.graphId }
    };
    await this.eventLog.append(runId, envelope);
    await this.publisher.publish({
      id: envelope.id,
      name: envelope.name,
      aggregateType: envelope.aggregateType,
      aggregateId: envelope.aggregateId,
      correlationId: envelope.correlationId,
      timestamp: envelope.timestamp,
      payload: envelope.payload
    });

    // Mark lease as busy
    await this.leaseStore.updateStatus(runId, "busy");

    // Persist initial snapshot (index 0 = the RunCreated event we just appended)
    if (this.snapshotStore !== undefined) {
      const aggregate = RunAggregate.create(run);
      await this.snapshotStore.save(aggregate.takeSnapshot(0));
    }

    return run;
  }
}
