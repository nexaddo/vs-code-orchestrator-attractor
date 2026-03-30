import type { JSX } from "preact";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ProgressBar,
  StatusBadge,
  type Status
} from "../components";
import { cancelRun, openRun } from "../app/postMessage";
import { cn, formatTimestamp } from "../lib/utils";
import type { OverviewState } from "./model";

export interface OverviewSurfaceProps {
  state: OverviewState;
}

export interface OverviewMetricViewModel {
  key: "repositories" | "plans" | "active-runs" | "paused" | "failed-24h";
  label: string;
  value: number;
  isFailure?: boolean;
}

export interface OverviewRepositoryViewModel {
  id: string;
  name: string;
  defaultBranch: string;
}

export interface OverviewRunViewModel {
  id: string;
  planId: string;
  planTitle?: string;
  status: Status;
  createdAt: string;
}

export interface OverviewViewModel {
  metrics: OverviewMetricViewModel[];
  repositories: OverviewRepositoryViewModel[];
  activeRuns: OverviewRunViewModel[];
  recentFailures: OverviewRunViewModel[];
}

function toStatusBadgeStatus(status: string): Status {
  switch (status) {
    case "queued":
    case "running":
    case "failed":
    case "canceled":
      return status;
    case "completed":
      return "succeeded";
    case "paused":
      return "blocked";
    default:
      return "queued";
  }
}

export function buildOverviewViewModel(
  state: OverviewState
): OverviewViewModel {
  return {
    metrics: [
      {
        key: "repositories",
        label: "Repositories",
        value: state.stats.totalRepos
      },
      {
        key: "plans",
        label: "Plans",
        value: state.stats.totalPlans
      },
      {
        key: "active-runs",
        label: "Active Runs",
        value: state.stats.activeRuns
      },
      {
        key: "paused",
        label: "Paused",
        value: state.stats.pausedRuns
      },
      {
        key: "failed-24h",
        label: "Failed 24h",
        value: state.stats.failedRuns24h,
        isFailure: true
      }
    ],
    repositories: state.repositories.map((repo) => ({
      id: repo.id,
      name: repo.name,
      defaultBranch: repo.defaultBranch
    })),
    activeRuns: state.activeRuns.map((run) => ({
      id: run.id,
      planId: run.planId,
      ...(run.planTitle !== undefined ? { planTitle: run.planTitle } : {}),
      status: toStatusBadgeStatus(run.status),
      createdAt: run.createdAt
    })),
    recentFailures: state.recentFailures.map((run) => ({
      id: run.id,
      planId: run.planId,
      ...(run.planTitle !== undefined ? { planTitle: run.planTitle } : {}),
      status: "failed" as const,
      createdAt: run.createdAt
    }))
  };
}

export function OverviewSurface({ state }: OverviewSurfaceProps): JSX.Element {
  const viewModel = buildOverviewViewModel(state);

  return (
    <div class="flex flex-col gap-3">
      {state.error && (
        <div
          data-testid="overview-error-banner"
          class="rounded-[--radius-sm] border border-[color:var(--color-status-failed-border,var(--color-destructive))] bg-[color:var(--color-status-failed-bg,var(--color-destructive/10))] px-3 py-2"
        >
          <div class="text-[length:var(--text-sm)] text-[color:var(--color-status-failed,var(--color-destructive))]">
            {state.error}
          </div>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Workspace Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            class="flex flex-wrap items-stretch gap-3"
            data-testid="overview-metrics"
          >
            {viewModel.metrics.map((metric) => (
              <div
                key={metric.key}
                data-testid={`overview-metric-${metric.key}`}
                class={cn(
                  "min-w-[8.5rem] flex-1 rounded-[--radius-sm] border",
                  "border-[color:var(--color-vscode-panel-border,var(--color-border))]",
                  "px-2 py-1.5"
                )}
              >
                <div class="text-[length:var(--text-xs)] text-[color:var(--color-vscode-description)]">
                  {metric.label}
                </div>
                <div class="mt-1 flex items-center">
                  <Badge
                    variant="count"
                    class={cn(
                      metric.isFailure &&
                        "bg-[color:var(--color-status-failed-bg)] text-[color:var(--color-status-failed)]"
                    )}
                    ariaLabel={`${metric.label}: ${metric.value}`}
                  >
                    {metric.value}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div
        class="grid grid-cols-1 gap-3 xl:grid-cols-3"
        data-testid="overview-grid"
      >
        <Card>
          <CardHeader>
            <CardTitle>Repositories</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2" data-testid="overview-repos">
            {viewModel.repositories.length === 0 ? (
              <EmptyState
                variant="inline"
                icon="codicon codicon-repo"
                heading="No repositories"
                subtext="Connect a repository to begin planning runs."
              />
            ) : (
              viewModel.repositories.map((repo) => (
                <div
                  key={repo.id}
                  class={cn(
                    "cursor-pointer rounded-[--radius-sm] border px-2 py-1.5",
                    "border-[color:var(--color-vscode-panel-border,var(--color-border))]",
                    "hover:bg-[color:var(--color-vscode-list-hover-bg,var(--color-muted))]"
                  )}
                >
                  <div class="truncate text-[length:var(--text-sm)] font-medium">
                    {repo.name}
                  </div>
                  <div class="text-[length:var(--text-xs)] text-[color:var(--color-vscode-description)]">
                    {repo.defaultBranch}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Runs</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2" data-testid="overview-active-runs">
            {viewModel.activeRuns.length === 0 ? (
              <EmptyState
                variant="inline"
                icon="codicon codicon-play-circle"
                heading="No active runs"
                subtext="Start a plan run to see execution progress here."
              />
            ) : (
              viewModel.activeRuns.map((run) => (
                <div
                  key={run.id}
                  class={cn(
                    "rounded-[--radius-sm] border px-2 py-1.5",
                    "border-[color:var(--color-vscode-panel-border,var(--color-border))]"
                  )}
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0 flex-1">
                      <div class="truncate text-[length:var(--text-sm)] font-medium">
                        {run.planTitle ?? run.planId}
                      </div>
                      <div class="text-[length:var(--text-xs)] text-[color:var(--color-vscode-description)]">
                        Started {formatTimestamp(run.createdAt)}
                      </div>
                      <ProgressBar
                        status={run.status}
                        class="mt-1.5"
                        label="Run progress"
                        height={4}
                      />
                    </div>
                    <div class="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={run.status} variant="text" />
                      <div class="flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openRun(run.id)}
                        >
                          Open
                        </Button>
                        {run.status === "running" && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => cancelRun(run.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Failures</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2" data-testid="overview-failures">
            {viewModel.recentFailures.length === 0 ? (
              <EmptyState
                variant="inline"
                icon="codicon codicon-error"
                heading="No recent failures"
                subtext="Runs that fail in the last 24 hours appear here."
              />
            ) : (
              viewModel.recentFailures.map((run) => (
                <Card key={run.id} intent="failure">
                  <CardContent class="px-2 py-1.5">
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0 flex-1">
                        <div class="truncate text-[length:var(--text-sm)] font-medium">
                          {run.planTitle ?? run.planId}
                        </div>
                        <div class="text-[length:var(--text-xs)] text-[color:var(--color-vscode-description)]">
                          Failed {formatTimestamp(run.createdAt)}
                        </div>
                      </div>
                      <div class="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status="failed" variant="text" />
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openRun(run.id)}
                        >
                          Triage
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
