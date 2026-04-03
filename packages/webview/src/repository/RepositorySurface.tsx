import type { JSX } from "preact";

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  LogLine,
  StatusBadge,
  type Status
} from "../components";
import { cn } from "../lib/utils";
import { openPlan, openRun } from "../app/postMessage";
import type { RepositoryState } from "./model";

export interface RepositorySurfaceProps {
  state: RepositoryState;
}

export interface RepositoryPlanViewModel {
  id: string;
  title: string;
  status: Status;
  updatedAt: string;
}

export interface RepositoryRunViewModel {
  id: string;
  planId: string;
  status: Status;
  attempt: number;
  createdAt: string;
}

export interface RepositoryActivityViewModel {
  id: string;
  level: "info" | "warn" | "error" | "debug";
  timestamp: string;
  text: string;
}

export interface RepositoryViewModel {
  id: string;
  name: string;
  defaultBranch: string;
  labels: string[];
  plans: RepositoryPlanViewModel[];
  runs: RepositoryRunViewModel[];
  activity: RepositoryActivityViewModel[];
}

function toPlanStatusBadgeStatus(
  status: RepositoryState["plans"][number]["status"]
): Status {
  switch (status) {
    case "draft":
    case "ready":
      return "queued";
    case "queued":
    case "running":
    case "failed":
    case "canceled":
      return status;
    case "paused":
      return "blocked";
    case "completed":
      return "succeeded";
  }
}

function toRunStatusBadgeStatus(
  status: RepositoryState["runs"][number]["status"]
): Status {
  switch (status) {
    case "queued":
    case "running":
    case "failed":
    case "canceled":
      return status;
    case "paused":
      return "blocked";
    case "completed":
      return "succeeded";
  }
}

function toActivityLevel(
  kind: RepositoryState["activity"][number]["kind"]
): "info" | "warn" | "error" | "debug" {
  switch (kind) {
    case "error":
    case "validation.failed":
      return "error";
    case "checkpoint.saved":
    case "checkpoint.restored":
      return "debug";
    case "status.changed":
    case "updated":
      return "warn";
    case "created":
    case "handoff.created":
    case "artifact.created":
      return "info";
  }
}

export function buildRepositoryViewModel(
  state: RepositoryState
): RepositoryViewModel {
  return {
    id: state.repository.id,
    name: state.repository.name,
    defaultBranch: state.repository.defaultBranch,
    labels: [...state.repository.labels],
    plans: state.plans.map((plan) => ({
      id: plan.id,
      title: plan.title,
      status: toPlanStatusBadgeStatus(plan.status),
      updatedAt: plan.updatedAt
    })),
    runs: state.runs.map((run) => ({
      id: run.id,
      planId: run.planId,
      status: toRunStatusBadgeStatus(run.status),
      attempt: run.attempt,
      createdAt: run.createdAt
    })),
    activity: state.activity.map((event) => ({
      id: event.id,
      level: toActivityLevel(event.kind),
      timestamp: event.timestamp,
      text: `${event.kind} · ${event.entityType}`
    }))
  };
}

export function RepositorySurface({
  state
}: RepositorySurfaceProps): JSX.Element {
  const viewModel = buildRepositoryViewModel(state);

  return (
    <div class="flex flex-col gap-3" data-testid="repository-content">
      <Card>
        <CardContent
          class="flex flex-wrap items-center gap-2"
          data-testid="repository-header"
        >
          <h2 class="truncate text-[length:var(--text-base)] font-semibold text-[color:var(--color-vscode-settings-header)]">
            {viewModel.name}
          </h2>
          <Badge variant="outline">{viewModel.defaultBranch}</Badge>
          {viewModel.labels.map((label) => (
            <Badge key={label} variant="default">
              {label}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Plans</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2" data-testid="repository-plans">
            {viewModel.plans.length === 0 ? (
              <EmptyState
                variant="inline"
                icon="codicon codicon-list-tree"
                heading="No plans yet"
              />
            ) : (
              viewModel.plans.map((plan) => (
                <div
                  key={plan.id}
                  class={cn(
                    "rounded-[--radius-sm] border px-2 py-1.5",
                    "border-[color:var(--color-vscode-panel-border,var(--color-border))]"
                  )}
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <div class="truncate text-[length:var(--text-sm)] font-medium">
                        {plan.title}
                      </div>
                      <div class="text-[length:var(--text-xs)] text-[color:var(--color-vscode-description)]">
                        {plan.updatedAt}
                      </div>
                    </div>
                    <div class="flex shrink-0 items-center gap-2">
                      <StatusBadge status={plan.status} variant="text" />
                      <button
                        type="button"
                        class="text-[length:var(--text-xs)] text-[color:var(--color-vscode-text-link)] hover:underline"
                        onClick={() => openPlan(plan.id)}
                      >
                        Open
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div class="grid grid-cols-1 gap-3">
          <Card>
            <CardHeader>
              <CardTitle>Runs</CardTitle>
            </CardHeader>
            <CardContent class="space-y-2" data-testid="repository-runs">
              {viewModel.runs.length === 0 ? (
                <EmptyState
                  variant="inline"
                  icon="codicon codicon-play-circle"
                  heading="No runs yet"
                />
              ) : (
                viewModel.runs.map((run) => (
                  <div
                    key={run.id}
                    class={cn(
                      "rounded-[--radius-sm] border px-2 py-1.5",
                      "border-[color:var(--color-vscode-panel-border,var(--color-border))]"
                    )}
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0">
                        <div class="truncate text-[length:var(--text-sm)] font-medium">
                          {run.id}
                        </div>
                        <div class="text-[length:var(--text-xs)] text-[color:var(--color-vscode-description)]">
                          Attempt {run.attempt} · {run.createdAt}
                        </div>
                      </div>
                      <div class="flex shrink-0 items-center gap-2">
                        <StatusBadge status={run.status} variant="text" />
                        <button
                          type="button"
                          class="text-[length:var(--text-xs)] text-[color:var(--color-vscode-text-link)] hover:underline"
                          onClick={() => openRun(run.id)}
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent class="space-y-1" data-testid="repository-activity">
              {viewModel.activity.length === 0 ? (
                <EmptyState
                  variant="inline"
                  icon="codicon codicon-history"
                  heading="No activity yet"
                />
              ) : (
                viewModel.activity.map((event) => (
                  <LogLine
                    key={event.id}
                    level={event.level}
                    timestamp={event.timestamp}
                    text={event.text}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
