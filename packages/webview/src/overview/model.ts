import { RepositoryRecord } from "@attractor/shared";

export interface WorkspaceSummary {
  totalRepositories: number;
  totalPlans: number;
  activeRuns: number;
}

export interface OverviewState {
  summary: WorkspaceSummary;
  repositories: RepositoryRecord[];
}
