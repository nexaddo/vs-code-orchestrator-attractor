# Backend Architecture

## Design Principles

- Thin vertical slice first; abstractions should follow proven pressure
- Repository-first observability with one writable repo per plan in v1
- Event-sourced runtime so dashboard, replay, and resume share one truth source
- Capability-based execution boundaries: writable repo vs read-only context repos
- Prompt context stays lean; durable state stays outside the model context window

## Package-Level Architecture

### `packages/extension`

#### `src/bootstrap`

- extension activation
- command registration
- webview registration
- chat participant registration

#### `src/domain`

- runtime-facing domain services composed from shared contracts
- reducers and policy helpers that are specific to the extension runtime

#### `src/orchestration`

- session coordinator
- run lifecycle controller
- milestone executor
- role handoff manager

#### `src/worktrees`

- git repo discovery
- branch naming
- worktree creation, reuse, cleanup, and reconciliation
- guardrails for one writable repo per plan

#### `src/storage`

- repository registry store
- plan store
- run store
- event log
- snapshot projector

#### `src/copilot`

- model gateway adapters
- role prompt builders
- streamed response adapters
- model error normalization

#### `src/graph`

- DOT lexer/parser wrapper
- Attractor subset validator
- semantic mapper from DOT to executable plan definition

#### `src/dashboard`

- projection services for repository, plan, run, and activity views
- webview message bridge

### `packages/shared`

- contracts and zod schemas
- shared IDs, enums, and message types
- common validation and serialization helpers

## Runtime Flow

1. User creates or imports a plan
2. DOT source is parsed into a semantic plan definition
3. Plan definition is stored with repositories and milestones
4. Running the plan creates a run record and acquires a worktree lease for the executable repo
5. Orchestrator emits events as milestones and role handoffs progress
6. Projectors update read models used by the dashboard
7. Resume, retry, or cancel acts on the same run model and event stream

## Core Domain Entities

### Repository

- stable repo identity, root URI, remote URL, default branch
- status summary for observability

### Plan

- durable user intent
- repository attachments
- DOT source and semantic definition
- default execution policy

### Milestone

- ordered unit of execution for v1
- acceptance criteria and linked graph nodes

### Run

- one execution attempt for a plan
- owns checkpoint state, current milestone, status, and artifacts

### Milestone Run

- attempt record for one milestone inside a run
- captures retry and resume history without mutating the original attempt

### Handoff

- structured baton between orchestrator, planner, implementer, and reviewer

### Artifact

- plan brief, task pack, review report, test evidence, prompt packet, logs, and graph snapshots

### Worktree Lease

- exclusive write lease over the executable repo for a specific run attempt

## Storage and Memory Layers

### Hot Runtime State

- in-process caches for active sessions and last projections
- safe to rebuild from persisted state

### Durable State

- append-only JSONL event log
- versioned JSON snapshot files
- versioned contract files for handoffs, decisions, and checkpoints

### Retrieval Layer

- indexed summaries and artifact metadata
- planner and reviewer retrieve compact summaries, not full transcripts

## Persistence Layout

Under extension storage:

```text
storage/
├─ repositories/
├─ plans/
│  └─ <plan-id>/
│     ├─ plan.json
│     ├─ graph.dot
│     ├─ milestones.json
│     └─ artifacts/
├─ runs/
│  └─ <run-id>/
│     ├─ run.json
│     ├─ checkpoints/
│     ├─ events.jsonl
│     └─ artifacts/
└─ indexes/
```

## Worktree Model

- each run attempt gets exactly one writable worktree for the executable repo in v1
- branch naming pattern: `attractor/<session-short>/<repo-short>/a<attempt>`
- resume reuses the same worktree lease when safe
- retry creates a new run attempt and a new worktree lease
- startup reconciliation compares persisted leases to `git worktree list --porcelain`

## Copilot Integration Surface

### Chat Participant

- `@attractor` is the single visible entrypoint
- supports actions like validate, plan, run, resume, and inspect

### Role Prompt Builders

- `orchestrator`
- `planner`
- `implementer`
- `reviewer`

Each role receives a compact baton, retrieved evidence, and the minimum current state required to act.

## DOT Parser Scope for v1

- accept a strict Attractor subset
- validate node types, edges, milestone references, and repository bindings
- surface diagnostics back to source and problem lists
- treat graph rendering as read-only derived state

## Key Interfaces

```ts
export interface ModelGateway {
  send(request: ModelRequest): Promise<ModelResponse>;
  stream(request: ModelRequest): AsyncIterable<ModelChunk>;
}

export interface PlanStore {
  savePlan(plan: PlanRecord): Promise<void>;
  loadPlan(planId: string): Promise<PlanRecord | null>;
}

export interface RunStore {
  saveRun(run: RunRecord): Promise<void>;
  loadRun(runId: string): Promise<RunRecord | null>;
}

export interface EventLog {
  append(event: ExtensionEvent): Promise<void>;
  listByRun(runId: string): Promise<ExtensionEvent[]>;
}

export interface WorktreeManager {
  acquire(input: AcquireLeaseInput): Promise<WorktreeLease>;
  release(leaseId: string): Promise<void>;
  reconcile(): Promise<ReconciliationReport>;
}
```

## Testing Seams

- model gateway is always mockable
- worktree manager is interface-backed and testable with fixture repos
- stores can run against file fixtures or in-memory fakes
- graph validation is pure and unit-test friendly
- dashboard uses read models projected from events, not direct runtime objects

## v1 to v1.1 Evolution

- keep `Plan.repositories[]` and `primaryExecutableRepositoryId` now
- in v1.1 add multiple executable repos and per-agent execution leases
- keep protocol versions in all persisted contracts so schema evolution stays manageable
