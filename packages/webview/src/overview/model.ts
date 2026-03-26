import type { RepositoryRecord, RunRecord } from "@attractor/shared";

export interface WorkspaceSummaryStats {
  totalRepos: number;
  totalPlans: number;
  activeRuns: number;
  pausedRuns: number;
  failedRuns24h: number;
}

export interface OverviewState {
  repositories: RepositoryRecord[];
  activeRuns: RunRecord[];
  recentFailures: RunRecord[];
  stats: WorkspaceSummaryStats;
  error?: string;
}
