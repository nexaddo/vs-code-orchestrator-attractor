import {
  type ExtensionEvent,
  type PlanStatePayload,
  type RunRecord
} from "@attractor/shared";

import { type StorageServices } from "../storage/services";

/**
 * Projects the current storage state into a PlanStatePayload for a given plan ID.
 *
 * - plan: the plan record identified by planId
 * - milestones: array of milestones associated with the plan
 * - history: array of runs executed for this plan
 * - validationEvents: array of validation.failed events from all runs in history, sorted by timestamp ascending
 *
 * Throws if the plan is not found.
 */
export async function projectPlan(
  planId: string,
  services: StorageServices
): Promise<PlanStatePayload> {
  // Fetch plan; throw if not found
  const plan = await services.planRegistry.getById(planId);
  if (!plan) {
    throw new Error(`Plan not found: ${planId}`);
  }

  // Fetch milestones for this plan
  const milestones = await services.milestoneRegistry.listByPlanId(planId);

  // Fetch all runs and filter by planId
  const allRuns = await services.runRegistry.list();
  const history = allRuns.filter(
    (run): run is RunRecord => run.planId === planId
  );

  // Collect validation.failed events from all runs in history
  const validationEvents: ExtensionEvent[] = [];
  for (const run of history) {
    const runEvents = await services.eventLog.listByRun(run.id);
    const runValidationEvents = runEvents.filter(
      (e): e is ExtensionEvent => e.kind === "validation.failed"
    );
    validationEvents.push(...runValidationEvents);
  }

  // Sort by timestamp ascending
  validationEvents.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return {
    plan,
    milestones,
    history,
    validationEvents
  };
}
