# Contracts

## Contract Rules

- every persisted or cross-boundary payload carries `version`
- every entity carries a stable `id`
- every command/request carries `requestId`
- timestamps are ISO strings in persisted JSON and epoch numbers in runtime events only when needed
- retries create new attempts; prior attempts remain immutable

## Core Records

```ts
export interface RepositoryRecord {
  version: 1;
  id: string;
  name: string;
  rootUri: string;
  remoteUrl?: string;
  defaultBranch: string;
  labels: string[];
}

export interface PlanRepositoryRef {
  repositoryId: string;
  role: "executable" | "context";
  access: "read_write" | "read_only";
  mountAlias: string;
  ref?: string;
}

export interface PlanRecord {
  version: 1;
  id: string;
  title: string;
  goal: string;
  status:
    | "draft"
    | "ready"
    | "queued"
    | "running"
    | "paused"
    | "completed"
    | "failed"
    | "canceled";
  repositories: PlanRepositoryRef[];
  primaryExecutableRepositoryId: string;
  graphSource: string;
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneRecord {
  version: 1;
  id: string;
  planId: string;
  title: string;
  order: number;
  status:
    | "pending"
    | "ready"
    | "running"
    | "paused"
    | "completed"
    | "failed"
    | "canceled"
    | "blocked";
  acceptanceCriteria: string[];
  nodeIds: string[];
}
```

## Run and Handoff Contracts

```ts
export interface RunRecord {
  version: 1;
  id: string;
  planId: string;
  repositoryId: string;
  attempt: number;
  status: "queued" | "running" | "paused" | "completed" | "failed" | "canceled";
  currentMilestoneId?: string;
  checkpointId?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface MilestoneRunRecord {
  version: 1;
  id: string;
  runId: string;
  milestoneId: string;
  attempt: number;
  status:
    | "queued"
    | "running"
    | "paused"
    | "completed"
    | "failed"
    | "canceled"
    | "blocked";
  startedAt?: string;
  endedAt?: string;
}

export interface HandoffEnvelope {
  version: 1;
  id: string;
  runId: string;
  fromRole: "orchestrator" | "planner" | "implementer" | "reviewer";
  toRole: "orchestrator" | "planner" | "implementer" | "reviewer";
  reason: string;
  task: string;
  visibleRepositoryIds: string[];
  writableRepositoryIds: string[];
  artifactIds: string[];
  lessons: string[];
  nextAction: string;
  createdAt: string;
}
```

## Artifact and Worktree Contracts

```ts
export interface ArtifactRecord {
  version: 1;
  id: string;
  runId?: string;
  milestoneRunId?: string;
  type:
    | "brief"
    | "task-pack"
    | "checkpoint"
    | "review"
    | "test-report"
    | "graph"
    | "log";
  title: string;
  uri: string;
  summary?: string;
  createdAt: string;
}

export interface WorktreeLease {
  version: 1;
  id: string;
  runId: string;
  repositoryId: string;
  branchName: string;
  worktreePath: string;
  state: "active" | "released" | "orphaned";
  headCommit?: string;
  createdAt: string;
  releasedAt?: string;
}
```

## Event Contract

```ts
export interface ExtensionEvent {
  version: 1;
  id: string;
  requestId?: string;
  runId?: string;
  entityType:
    | "repository"
    | "plan"
    | "milestone"
    | "run"
    | "handoff"
    | "artifact"
    | "worktree";
  entityId: string;
  kind:
    | "created"
    | "updated"
    | "status.changed"
    | "checkpoint.saved"
    | "checkpoint.restored"
    | "handoff.created"
    | "artifact.created"
    | "validation.failed"
    | "error";
  timestamp: string;
  payload: Record<string, unknown>;
}
```

## Webview Message Contracts

```ts
export interface WebviewInboundMessage {
  version: 1;
  type:
    | "repository.open"
    | "plan.create"
    | "plan.run"
    | "run.resume"
    | "run.cancel"
    | "run.retry"
    | "milestone.open"
    | "graph.focus";
  payload: Record<string, unknown>;
}

export interface WebviewOutboundMessage {
  version: 1;
  type:
    | "overview.state"
    | "repository.state"
    | "plan.state"
    | "run.state"
    | "timeline.update"
    | "graph.update"
    | "toast";
  payload: Record<string, unknown>;
}
```

## Memory Contracts

### Shared State Snapshot

```json
{
  "version": 1,
  "planId": "plan_release_prep",
  "runId": "run_142",
  "primaryRepoId": "repo_beta",
  "contextRepoIds": ["repo_docs"],
  "currentMilestoneId": "milestone_publish",
  "activeRole": "implementer",
  "currentFacts": [
    "repo_beta is the only writable repository",
    "repo_docs is read-only context",
    "publish step is blocked on release token configuration"
  ]
}
```

### Handoff Example

```json
{
  "version": 1,
  "id": "handoff_42",
  "runId": "run_142",
  "fromRole": "reviewer",
  "toRole": "implementer",
  "reason": "fix requested",
  "task": "repair publish credential flow",
  "visibleRepositoryIds": ["repo_beta", "repo_docs"],
  "writableRepositoryIds": ["repo_beta"],
  "artifactIds": ["review_42", "test_report_17"],
  "lessons": [
    "do not mutate repo_docs in v1",
    "publish retries must preserve existing artifacts"
  ],
  "nextAction": "update credential loading and rerun release smoke tests",
  "createdAt": "2026-03-10T00:00:00Z"
}
```
