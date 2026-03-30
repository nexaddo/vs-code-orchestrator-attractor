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
import { cancelRun, resumeRun, retryRun } from "../app/postMessage";
import { cn, formatDuration, formatTimestamp } from "../lib/utils";
import type { RunState } from "./model";

export interface RunSurfaceProps {
  state: RunState;
}

export interface TimelineMilestoneRunViewModel {
  id: string;
  nodeId: string;
  status: Status;
  startedAt: string;
  endedAt?: string;
  errorMessage?: string;
}

export interface ArtifactViewModel {
  id: string;
  title: string;
  type: string;
  createdAt: string;
}

export interface CurrentHandoffViewModel {
  fromRole: string;
  toRole: string;
  task: string;
  reason: string;
}

export interface RunViewModel {
  header: {
    runId: string;
    status: Status;
    runStatus: string;
    planTitle: string;
    attemptLabel: string;
  };
  timeline: TimelineMilestoneRunViewModel[];
  artifacts: ArtifactViewModel[];
  progress: {
    succeeded: number;
    total: number;
    percent: number;
    label: string;
  };
  currentHandoff?: CurrentHandoffViewModel;
}

function toRunStatus(status: RunState["run"]["status"]): Status {
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
  }
}

function toRoleLabel(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function buildRunViewModel(state: RunState): RunViewModel {
  const timeline = state.milestoneRuns.map((milestoneRun) => {
    const base: TimelineMilestoneRunViewModel = {
      id: milestoneRun.id,
      nodeId: milestoneRun.nodeId,
      status: milestoneRun.status,
      startedAt: milestoneRun.startedAt
    };

    if (milestoneRun.endedAt) {
      base.endedAt = milestoneRun.endedAt;
    }

    if (milestoneRun.errorMessage) {
      base.errorMessage = milestoneRun.errorMessage;
    }

    return base;
  });

  const succeeded = timeline.filter(
    (milestoneRun) => milestoneRun.status === "succeeded"
  ).length;
  const total = timeline.length;
  const percent = total === 0 ? 0 : (succeeded / total) * 100;

  const viewModel: RunViewModel = {
    header: {
      runId: state.run.id,
      status: toRunStatus(state.run.status),
      runStatus: state.run.status,
      planTitle: state.plan.title,
      attemptLabel: `Attempt ${state.run.attempt}`
    },
    timeline,
    artifacts: state.artifacts.map((artifact) => ({
      id: artifact.id,
      title: artifact.title,
      type: artifact.type,
      createdAt: formatTimestamp(artifact.createdAt)
    })),
    progress: {
      succeeded,
      total,
      percent,
      label: `${succeeded}/${total} milestones succeeded`
    }
  };

  if (state.currentHandoff) {
    viewModel.currentHandoff = {
      fromRole: toRoleLabel(state.currentHandoff.fromRole),
      toRole: toRoleLabel(state.currentHandoff.toRole),
      task: state.currentHandoff.task,
      reason: state.currentHandoff.reason
    };
  }

  return viewModel;
}

export function RunSurface({ state }: RunSurfaceProps): JSX.Element {
  const viewModel = buildRunViewModel(state);

  return (
    <div class="flex flex-col gap-3" data-testid="run-content">
      <Card>
        <CardContent
          class="flex flex-wrap items-start justify-between gap-2"
          data-testid="run-header"
        >
          <div class="min-w-0 flex-1">
            <h2 class="truncate text-[length:var(--text-base)] font-semibold">
              {viewModel.header.runId}
            </h2>
            <p class="text-[length:var(--text-sm)] text-[color:var(--color-vscode-description)]">
              {viewModel.header.planTitle}
            </p>
          </div>
          <div class="flex shrink-0 flex-col items-end gap-1">
            <div class="flex items-center gap-2">
              <StatusBadge status={viewModel.header.status} variant="text" />
              <Badge variant="outline">{viewModel.header.attemptLabel}</Badge>
            </div>
            <div class="flex gap-1">
              {viewModel.header.runStatus === "paused" && (
                <Button
                  size="sm"
                  icon="codicon codicon-debug-continue"
                  onClick={() => resumeRun(viewModel.header.runId)}
                >
                  Resume
                </Button>
              )}
              {viewModel.header.runStatus === "running" && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => cancelRun(viewModel.header.runId)}
                >
                  Cancel
                </Button>
              )}
              {viewModel.header.runStatus === "failed" && (
                <Button
                  size="sm"
                  icon="codicon codicon-refresh"
                  onClick={() => retryRun(viewModel.header.runId)}
                >
                  Retry Failed
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
          <Badge variant="count">{viewModel.progress.label}</Badge>
        </CardHeader>
        <CardContent data-testid="run-progress">
          <ProgressBar
            value={viewModel.progress.percent}
            status={viewModel.header.status}
            label={viewModel.progress.label}
            height={6}
          />
        </CardContent>
      </Card>

      <div class="flex flex-col gap-3">
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2" data-testid="run-timeline">
            {viewModel.timeline.length === 0 ? (
              <EmptyState
                variant="inline"
                icon="codicon codicon-git-pull-request"
                heading="No milestone runs yet"
              />
            ) : (
              viewModel.timeline.map((milestoneRun) => (
                <div
                  key={milestoneRun.id}
                  class={cn(
                    "rounded-[--radius-sm] border px-2 py-1.5",
                    "border-[color:var(--color-vscode-panel-border,var(--color-border))]"
                  )}
                >
                  <div class="flex flex-wrap items-start justify-between gap-2">
                    <div class="min-w-0">
                      <div class="truncate text-[length:var(--text-sm)] font-medium">
                        {milestoneRun.nodeId}
                      </div>
                      {milestoneRun.status !== "queued" && (
                        <div class="text-[length:var(--text-xs)] text-[color:var(--color-vscode-description)]">
                          Started: {formatTimestamp(milestoneRun.startedAt)}
                        </div>
                      )}
                      {milestoneRun.endedAt && (
                        <div class="text-[length:var(--text-xs)] text-[color:var(--color-vscode-description)]">
                          Ended: {formatTimestamp(milestoneRun.endedAt)}
                        </div>
                      )}
                      {milestoneRun.status === "succeeded" &&
                        milestoneRun.endedAt && (
                          <div class="text-[length:var(--text-xs)] text-[color:var(--color-vscode-description)]">
                            Duration:{" "}
                            {formatDuration(
                              milestoneRun.startedAt,
                              milestoneRun.endedAt
                            )}
                          </div>
                        )}
                      {milestoneRun.errorMessage && (
                        <div class="mt-1 text-[length:var(--text-xs)] text-[color:var(--color-status-failed)]">
                          {milestoneRun.errorMessage}
                        </div>
                      )}
                    </div>
                    <StatusBadge status={milestoneRun.status} variant="text" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Artifacts</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2" data-testid="run-artifacts">
            {viewModel.artifacts.length === 0 ? (
              <EmptyState
                variant="inline"
                icon="codicon codicon-archive"
                heading="No artifacts yet"
              />
            ) : (
              viewModel.artifacts.map((artifact) => (
                <div
                  key={artifact.id}
                  class={cn(
                    "flex flex-wrap items-start justify-between gap-2 rounded-[--radius-sm] border px-2 py-1.5",
                    "border-[color:var(--color-vscode-panel-border,var(--color-border))]"
                  )}
                >
                  <div class="min-w-0">
                    <div class="truncate text-[length:var(--text-sm)] font-medium">
                      {artifact.title}
                    </div>
                    <div class="text-[length:var(--text-xs)] text-[color:var(--color-vscode-description)]">
                      {artifact.createdAt}
                    </div>
                  </div>
                  <Badge variant="outline">{artifact.type}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {viewModel.currentHandoff && (
          <Card data-testid="run-handoff">
            <CardHeader>
              <CardTitle>Current Handoff</CardTitle>
            </CardHeader>
            <CardContent class="space-y-2">
              <div class="flex items-center gap-2 text-[length:var(--text-sm)]">
                <Badge variant="outline">
                  {viewModel.currentHandoff.fromRole}
                </Badge>
                <span aria-hidden="true">→</span>
                <Badge variant="outline">
                  {viewModel.currentHandoff.toRole}
                </Badge>
              </div>
              <div>
                <div class="text-[length:var(--text-xs)] text-[color:var(--color-vscode-description)]">
                  Task
                </div>
                <div class="text-[length:var(--text-sm)]">
                  {viewModel.currentHandoff.task}
                </div>
              </div>
              <div>
                <div class="text-[length:var(--text-xs)] text-[color:var(--color-vscode-description)]">
                  Reason
                </div>
                <div class="text-[length:var(--text-sm)]">
                  {viewModel.currentHandoff.reason}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
