import { type RepositoryStatePayload } from "@attractor/shared";

import { type StorageServices } from "../storage/services";

/**
 * Projects the current storage state into a RepositoryStatePayload for a given repository.
 *
 * - repository: the RepositoryRecord for the given ID
 * - plans: all plans that include this repository in their repositories array
 * - runs: all runs that belong to the filtered plans
 * - activity: all events from the filtered runs, merged and sorted by timestamp
 */
export async function projectRepository(
  repositoryId: string,
  services: StorageServices
): Promise<RepositoryStatePayload> {
  // Get the repository
  const repository = await services.repositoryRegistry.getById(repositoryId);
  if (!repository) {
    throw new Error(`Repository not found: ${repositoryId}`);
  }

  // Get all plans and filter to those that include this repository
  const allPlans = await services.planRegistry.list();
  const filteredPlans = allPlans.filter((plan) =>
    plan.repositories.some((r) => r.repositoryId === repositoryId)
  );

  // Get all runs and filter to those that belong to the filtered plans
  const allRuns = await services.runRegistry.list();
  const filteredPlanIds = new Set(filteredPlans.map((p) => p.id));
  const filteredRuns = allRuns.filter((run) => filteredPlanIds.has(run.planId));

  // Get all events from the filtered runs and merge them
  const eventArrays = await Promise.all(
    filteredRuns.map((run) => services.eventLog.listByRun(run.id))
  );
  const activity = eventArrays
    .flat()
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return {
    repository,
    plans: filteredPlans,
    runs: filteredRuns,
    activity
  };
}
