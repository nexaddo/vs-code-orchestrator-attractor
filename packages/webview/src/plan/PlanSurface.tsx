import type { ExtensionEvent } from "@attractor/shared";
import type { JSX } from "preact";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  LogLine,
  ProgressBadge,
  StatusBadge,
  type Status
} from "../components";
import { cn } from "../lib/utils";
import type { PlanState } from "./model";

export interface PlanSurfaceProps {
  state: PlanState;
}

export interface PlanRepositoryViewModel {
  repositoryId: string;
  role: string;
  access: string;
  mountAlias: string;
  ref?: string | undefined;
}

export interface PlanMilestoneViewModel {
  id: string;
  title: string;
  order: number;
  status: Status;
  acceptanceCriteriaCount: number;
}

export interface PlanRunViewModel {
  id: string;
  status: Status;
  attempt: number;
  createdAt: string;
}

export interface PlanValidationEventViewModel {
  id: string;
  kind: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
}

export interface PlanViewModel {
  title: string;
  goal: string;
  status: Status;
  graphSource: string;
  createdAt: string;
  updatedAt: string;
  repositories: PlanRepositoryViewModel[];
  milestones: PlanMilestoneViewModel[];
  history: PlanRunViewModel[];
  validationEvents: PlanValidationEventViewModel[];
  milestoneProgress: {
    current: number;
    total: number;
  };
}

function toPlanStatus(status: string): Status {
  switch (status) {
    case "draft":
    case "ready":
      return "queued";
    case "paused":
      return "blocked";
    case "completed":
      return "succeeded";
    case "queued":
    case "running":
    case "failed":
    case "canceled":
      return status;
    default:
      return "queued";
  }
}

function toMilestoneStatus(status: string): Status {
  switch (status) {
    case "pending":
    case "ready":
      return "queued";
    case "paused":
      return "blocked";
    case "completed":
      return "succeeded";
    case "running":
    case "failed":
    case "canceled":
    case "blocked":
      return status;
    default:
      return "queued";
  }
}

function toRunStatus(status: string): Status {
  switch (status) {
    case "paused":
      return "blocked";
    case "completed":
      return "succeeded";
    case "queued":
    case "running":
    case "failed":
    case "canceled":
      return status;
    default:
      return "queued";
  }
}

function toValidationLevel(kind: string): "info" | "warn" | "error" | "debug" {
  if (kind === "validation.failed" || kind === "error") {
    return "error";
  }

  if (kind === "status.changed") {
    return "warn";
  }

  if (kind.endsWith("saved") || kind.endsWith("restored")) {
    return "debug";
  }

  return "info";
}

function summarizeEventPayload(event: ExtensionEvent): string {
  if (
    typeof event.payload.message === "string" &&
    event.payload.message.length
  ) {
    return event.payload.message;
  }

  if (typeof event.payload.reason === "string" && event.payload.reason.length) {
    return event.payload.reason;
  }

  const payloadEntries = Object.entries(event.payload);
  if (payloadEntries.length === 0) {
    return `${event.entityType}:${event.entityId}`;
  }

  const firstEntry = payloadEntries[0];
  if (!firstEntry) {
    return `${event.entityType}:${event.entityId}`;
  }

  const [firstKey, firstValue] = firstEntry;
  const renderedValue =
    typeof firstValue === "string" || typeof firstValue === "number"
      ? String(firstValue)
      : JSON.stringify(firstValue);

  return `${firstKey}=${renderedValue}`;
}

export function buildPlanViewModel(state: PlanState): PlanViewModel {
  const milestones = [...state.milestones]
    .sort((a, b) => a.order - b.order)
    .map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      order: milestone.order,
      status: toMilestoneStatus(milestone.status),
      acceptanceCriteriaCount: milestone.acceptanceCriteria.length
    }));

  const completedMilestones = state.milestones.filter(
    (milestone) => milestone.status === "completed"
  ).length;

  return {
    title: state.plan.title,
    goal: state.plan.goal,
    status: toPlanStatus(state.plan.status),
    graphSource: state.plan.graphSource,
    createdAt: state.plan.createdAt,
    updatedAt: state.plan.updatedAt,
    repositories: state.plan.repositories.map((repository) => ({
      repositoryId: repository.repositoryId,
      role: repository.role,
      access: repository.access,
      mountAlias: repository.mountAlias,
      ref: repository.ref
    })),
    milestones,
    history: [...state.history].map((run) => ({
      id: run.id,
      status: toRunStatus(run.status),
      attempt: run.attempt,
      createdAt: run.createdAt
    })),
    validationEvents: [...state.validationEvents].map((event) => ({
      id: event.id,
      kind: event.kind,
      timestamp: event.timestamp,
      level: toValidationLevel(event.kind),
      message: summarizeEventPayload(event)
    })),
    milestoneProgress: {
      current: completedMilestones,
      total: state.milestones.length
    }
  };
}

export function PlanSurface({ state }: PlanSurfaceProps): JSX.Element {
  const viewModel = buildPlanViewModel(state);

  return (
    <div class="flex flex-col gap-3" data-testid="plan-content">
      <Card data-testid="plan-header">
        <CardHeader>
          <div class="min-w-0">
            <CardTitle class="truncate text-[length:var(--text-base)]">
              {viewModel.title}
            </CardTitle>
            <p class="mt-1 text-[length:var(--text-sm)] text-[color:var(--color-vscode-description)]">
              {viewModel.goal}
            </p>
          </div>
          <StatusBadge status={viewModel.status} variant="text" />
        </CardHeader>
        <CardContent class="space-y-2">
          <div class="text-[length:var(--text-xs)] text-[color:var(--color-vscode-description)]">
            Graph Source: {viewModel.graphSource}
          </div>
          <div class="text-[length:var(--text-xs)] text-[color:var(--color-vscode-description)]">
            Created: {viewModel.createdAt} · Updated: {viewModel.updatedAt}
          </div>
          <div class="space-y-1">
            <div class="text-[length:var(--text-xs)] text-[color:var(--color-vscode-description)]">
              Repositories
            </div>
            <div class="space-y-1">
              {viewModel.repositories.map((repository) => (
                <div
                  key={repository.repositoryId}
                  class={cn(
                    "rounded-[--radius-sm] border px-2 py-1.5 text-[length:var(--text-xs)]",
                    "border-[color:var(--color-vscode-panel-border,var(--color-border))]"
                  )}
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="truncate font-medium">
                      {repository.repositoryId}
                    </span>
                    <span class="uppercase tracking-wide text-[color:var(--color-vscode-description)]">
                      {repository.access}
                    </span>
                  </div>
                  <div class="mt-1 text-[color:var(--color-vscode-description)]">
                    role={repository.role} · mount={repository.mountAlias}
                    {repository.ref ? ` · ref=${repository.ref}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Milestones</CardTitle>
            <ProgressBadge
              current={viewModel.milestoneProgress.current}
              total={viewModel.milestoneProgress.total}
            />
          </CardHeader>
          <CardContent class="space-y-2" data-testid="plan-milestones">
            {viewModel.milestones.length === 0 ? (
              <EmptyState
                variant="inline"
                icon="codicon codicon-list-unordered"
                heading="No milestones defined"
              />
            ) : (
              viewModel.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  class={cn(
                    "rounded-[--radius-sm] border px-2 py-1.5",
                    "border-[color:var(--color-vscode-panel-border,var(--color-border))]"
                  )}
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <div class="truncate text-[length:var(--text-sm)] font-medium">
                        {milestone.title}
                      </div>
                      <div class="text-[length:var(--text-xs)] text-[color:var(--color-vscode-description)]">
                        Order {milestone.order} ·{" "}
                        {milestone.acceptanceCriteriaCount} acceptance criteria
                      </div>
                    </div>
                    <StatusBadge status={milestone.status} variant="text" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div class="flex flex-col gap-3">
          <Card>
            <CardHeader>
              <CardTitle>Run History</CardTitle>
            </CardHeader>
            <CardContent class="space-y-2" data-testid="plan-history">
              {viewModel.history.length === 0 ? (
                <EmptyState
                  variant="inline"
                  icon="codicon codicon-history"
                  heading="No runs yet"
                />
              ) : (
                viewModel.history.map((run) => (
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
                      <StatusBadge status={run.status} variant="text" />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {viewModel.validationEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Validation Events</CardTitle>
              </CardHeader>
              <CardContent class="px-0 py-1" data-testid="plan-validation">
                {viewModel.validationEvents.map((event) => (
                  <LogLine
                    key={event.id}
                    level={event.level}
                    timestamp={event.timestamp}
                    text={`${event.kind} — ${event.message}`}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
