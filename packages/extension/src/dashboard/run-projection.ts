import {
  type RunStatePayload,
  type HandoffEnvelope,
  type ExtensionEvent
} from "@attractor/shared";

import { type StorageServices } from "../storage/services";

/**
 * Projects the current storage state into a RunStatePayload for a given run ID.
 *
 * - run: the run record identified by runId
 * - plan: the plan record for the run's planId
 * - milestoneRuns: array of milestone runs for this run
 * - artifacts: array of artifacts for this run
 * - currentHandoff: the most recent HandoffEnvelope from a "handoff.created" event, if any exist; undefined otherwise
 *
 * Throws if the run or plan is not found.
 */
export async function projectRun(
  runId: string,
  services: StorageServices
): Promise<RunStatePayload> {
  // Fetch run; throw if not found
  const run = await services.runRegistry.getById(runId);
  if (!run) {
    throw new Error(`Run not found: ${runId}`);
  }

  // Fetch plan; throw if not found
  const plan = await services.planRegistry.getById(run.planId);
  if (!plan) {
    throw new Error(`Plan not found for run ${runId}: ${run.planId}`);
  }

  // Fetch milestone runs and artifacts in parallel
  const [milestoneRuns, artifacts] = await Promise.all([
    services.milestoneRunRegistry.listByRunId(runId),
    services.artifactRegistry.listByRunId(runId)
  ]);

  // Fetch events and find the most recent handoff.created event
  const events = await services.eventLog.listByRun(runId);
  const handoffEvents = events.filter(
    (e): e is ExtensionEvent => e.kind === "handoff.created"
  );

  let currentHandoff: HandoffEnvelope | undefined;
  if (handoffEvents.length > 0) {
    // Take the last (most recent) handoff event
    const lastHandoffEvent = handoffEvents[handoffEvents.length - 1];
    if (lastHandoffEvent) {
      currentHandoff = lastHandoffEvent.payload as unknown as HandoffEnvelope;
    }
  }

  return {
    run,
    plan,
    milestoneRuns,
    artifacts,
    currentHandoff
  };
}
