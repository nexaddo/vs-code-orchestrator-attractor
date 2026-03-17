import { type RepositoryRecord } from "@attractor/shared";

import { type StorageServices } from "../storage/services";

export interface WorkspaceSummary {
  totalRepositories: number;
  totalPlans: number;
  activeRuns: number;
}

export interface OverviewState {
  summary: WorkspaceSummary;
  repositories: RepositoryRecord[];
}

/**
 * Projects the current storage state into an OverviewState for the dashboard.
 *
 * activeRunCount rule: queued | running | paused = active.
 * terminal statuses (completed | failed | canceled) are excluded.
 * This rule is enforced by runRegistry.listActiveRuns() — do not restate here.
 */
export async function projectOverview(
  services: StorageServices
): Promise<OverviewState> {
  const [repositories, plans, activeRuns] = await Promise.all([
    services.repositoryRegistry.list(),
    services.planRegistry.list(),
    services.runRegistry.listActiveRuns()
  ]);

  return {
    summary: {
      totalRepositories: repositories.length,
      totalPlans: plans.length,
      activeRuns: activeRuns.length
    },
    repositories
  };
}
