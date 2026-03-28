import { type OverviewStatePayload, type RunRecord } from "@attractor/shared";

import { type StorageServices } from "../storage/services";

/**
 * Projects the current storage state into an OverviewStatePayload for the dashboard.
 *
 * - activeRuns: array of runs with status "queued", "running", or "paused"
 * - recentFailures: array of runs with status "failed"
 * - stats: aggregated counts of repositories, plans, and run statuses
 */
export async function projectOverview(
  services: StorageServices
): Promise<OverviewStatePayload> {
  const [repositories, plans, allRuns] = await Promise.all([
    services.repositoryRegistry.list(),
    services.planRegistry.list(),
    services.runRegistry.list()
  ]);

  const activeRuns = allRuns.filter(
    (r): r is RunRecord =>
      r.status === "queued" || r.status === "running" || r.status === "paused"
  );
  const recentFailures = allRuns.filter(
    (r): r is RunRecord => r.status === "failed"
  );
  const pausedRuns = allRuns.filter((r) => r.status === "paused");

  return {
    repositories,
    activeRuns,
    recentFailures,
    stats: {
      totalRepos: repositories.length,
      totalPlans: plans.length,
      activeRuns: activeRuns.length,
      pausedRuns: pausedRuns.length,
      failedRuns24h: recentFailures.length
    }
  };
}
