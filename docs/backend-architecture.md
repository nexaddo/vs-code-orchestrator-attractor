# Backend Architecture - Attractor v1

## Purpose

Attractor v1 is a TypeScript VS Code extension that orchestrates graph-driven coding runs in isolated git worktrees, persists execution state, and uses GitHub Copilot as the primary LLM surface. This document defines the backend-only architecture: module boundaries, contracts, eventing, storage, orchestration, parser scope, and testing seams.

## Goals

- Provide a deterministic backend core that can run task graphs independent of UI details.
- Isolate side effects behind ports so orchestration logic is testable without VS Code, git, or Copilot.
- Model runs as evented workflows with resumable state and observable progress.
- Support greenfield v1 scope with simple persistence and explicit extensibility points.

## Non-Goals

- Rich UI composition, webview architecture, or visual graph editing.
- Multi-user collaboration or remote distributed execution.
- Full Graphviz compatibility beyond the task-graph subset defined here.
- Long-term semantic memory or production-grade vector search in v1.

## Architectural Style

Use a layered modular monolith inside the extension host:

1. `domain`: pure business rules, entities, value objects, invariants, domain events.
2. `application`: use cases, orchestration policies, command handlers, event publishing.
3. `infrastructure`: git, filesystem, VS Code storage, Copilot adapters, parser implementation.
4. `extension`: VS Code activation, command registration, configuration wiring, lifecycle.

Rules:

- `domain` depends on nothing.
- `application` depends only on `domain` and port interfaces.
- `infrastructure` implements `application` ports.
- `extension` composes concrete implementations and exposes commands/services.

## Proposed Module Boundaries

```text
src/
  extension/
    activate.ts
    serviceContainer.ts
    commands/
  domain/
    attractor/
      entities/
      events/
      valueObjects/
      policies/
  application/
    contracts/
    commands/
    queries/
    services/
    orchestrators/
  infrastructure/
    git/
    worktree/
    storage/
    copilot/
    parser/
    telemetry/
    clock/
    ids/
  testkit/
    fakes/
    fixtures/
    builders/
```

### Domain Modules

- `graph-model`: task graph, node/edge semantics, validation rules.
- `run-model`: run/session lifecycle, step transitions, failure semantics.
- `memory-model`: memory records, summaries, artifact references.
- `worktree-model`: worktree allocation, ownership, lifecycle state.
- `event-model`: canonical event envelope and typed event names.

### Application Modules

- `graph-intake`: parse, validate, normalize DOT input into executable plans.
- `run-orchestration`: execute graph runs, manage retries, resume, cancellation.
- `worktree-orchestration`: create/lease/cleanup worktrees per run or node.
- `memory-service`: save and retrieve run memory, summaries, artifacts.
- `copilot-session-service`: broker prompts, streaming responses, tool calls.
- `projection-service`: build read models for tree views, logs, run summaries.

### Infrastructure Modules

- `dot-parser-adapter`: DOT subset parser and normalization.
- `git-cli-adapter`: shell-backed git operations with typed results.
- `filesystem-storage-adapter`: JSON/blob persistence under workspace storage.
- `vscode-memento-adapter`: small metadata persistence via `workspaceState`/`globalState`.
- `copilot-chat-adapter`: GitHub Copilot chat/model integration.
- `telemetry-adapter`: optional event forwarding to VS Code telemetry/output channel.

## Core Execution Model

The runtime unit is a `Run` created from a validated `TaskGraph`.

- A graph contains executable `TaskNode`s connected by dependency edges.
- A run progresses nodes when all inbound dependencies are satisfied.
- Each node executes inside an assigned `WorktreeLease`.
- Node execution emits events and appends memory/artifacts.
- Run state is rebuilt from persisted snapshots plus event log if needed.

Recommended v1 execution policy:

- Default sequential execution.
- Optional bounded parallelism later via scheduler policy.
- Fail-fast by default, with per-node retry policy override.
- Explicit cancellation support at run and node levels.

## Domain Entities

### Aggregate Roots

#### `TaskGraph`

- Represents the normalized executable graph.
- Owns node and edge collections plus graph-level metadata.
- Enforces acyclic dependency validation for executable edges.

Suggested shape:

```ts
type GraphId = string;
type NodeId = string;
type EdgeId = string;

interface TaskGraph {
  id: GraphId;
  version: number;
  source: GraphSource;
  nodes: Record<NodeId, TaskNode>;
  edges: Record<EdgeId, TaskEdge>;
  entryNodeIds: NodeId[];
  metadata: GraphMetadata;
}
```

#### `Run`

- Represents one execution attempt of a graph.
- Owns node run states, timing, failure details, and output references.
- Emits lifecycle events when status changes.

```ts
type RunId = string;

interface Run {
  id: RunId;
  graphId: GraphId;
  status: RunStatus;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  nodes: Record<NodeId, NodeExecution>;
  policy: ExecutionPolicy;
  memoryRef?: MemoryScopeRef;
}
```

#### `WorktreeLease`

- Represents a temporary claim on a git worktree for a run or node.
- Prevents conflicting writes across concurrent executions.

```ts
type WorktreeId = string;

interface WorktreeLease {
  id: WorktreeId;
  repoRoot: string;
  worktreePath: string;
  branchName: string;
  headSha?: string;
  purpose: "run" | "node";
  ownerRunId: RunId;
  ownerNodeId?: NodeId;
  status: WorktreeStatus;
  createdAt: string;
  releasedAt?: string;
}
```

#### `MemoryRecord`

- Represents persisted context produced or consumed during execution.
- Supports timeline queries and scoped retrieval by run, node, or workspace.

```ts
type MemoryRecordId = string;

interface MemoryRecord {
  id: MemoryRecordId;
  scope: MemoryScopeRef;
  kind: MemoryKind;
  createdAt: string;
  tags: string[];
  content: MemoryContent;
  sourceEventId?: string;
}
```

### Entities and Value Objects

- `TaskNode`: prompt/instructions, inputs, expected outputs, retry policy, execution mode.
- `TaskEdge`: dependency relation, optional condition, artifact passing semantics.
- `NodeExecution`: runtime state for one node in one run.
- `ArtifactRef`: path, media type, producer node, checksum.
- `PromptTemplate`: resolved instructions delivered to Copilot.
- `ExecutionPolicy`: concurrency, retries, timeout, fail-fast.
- `GraphSource`: raw DOT content, checksum, parser version.
- `MemoryScopeRef`: `workspace`, `graph`, `run`, or `node` scope.

### Enums

```ts
type RunStatus =
  | "pending"
  | "ready"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

type NodeStatus =
  | "blocked"
  | "ready"
  | "running"
  | "succeeded"
  | "failed"
  | "skipped"
  | "cancelled";

type WorktreeStatus =
  | "allocating"
  | "ready"
  | "busy"
  | "releasing"
  | "released"
  | "failed";

type MemoryKind =
  | "note"
  | "summary"
  | "artifact"
  | "decision"
  | "error"
  | "handoff";
```

## Event Model

Use domain-style immutable events with a shared envelope. Events are used for orchestration, projections, persistence, and telemetry.

### Event Envelope

```ts
interface DomainEvent<TName extends string = string, TPayload = unknown> {
  id: string;
  name: TName;
  occurredAt: string;
  aggregateType: "graph" | "run" | "worktree" | "memory";
  aggregateId: string;
  correlationId: string;
  causationId?: string;
  version: number;
  payload: TPayload;
}
```

### Canonical Events

#### Graph Events

- `graph.parsed`
- `graph.validationFailed`
- `graph.normalized`

#### Run Events

- `run.created`
- `run.queued`
- `run.started`
- `run.paused`
- `run.resumed`
- `run.cancelRequested`
- `run.cancelled`
- `run.completed`
- `run.failed`

#### Node Events

- `node.ready`
- `node.started`
- `node.promptPrepared`
- `node.copilotRequested`
- `node.copilotDeltaReceived`
- `node.copilotCompleted`
- `node.artifactProduced`
- `node.memoryAppended`
- `node.succeeded`
- `node.failed`
- `node.retryScheduled`
- `node.skipped`

#### Worktree Events

- `worktree.allocationRequested`
- `worktree.allocated`
- `worktree.prepared`
- `worktree.checkoutFailed`
- `worktree.released`
- `worktree.releaseFailed`

#### Memory Events

- `memory.recorded`
- `memory.summarized`
- `memory.compacted`

### Eventing Rules

- Events are append-only and never mutated.
- Application services react to events through in-process subscribers.
- Persistence uses both snapshots and an event log; v1 may rebuild read models from snapshots first, events second.
- UI-facing progress should consume read models, not raw orchestration internals.

## Worktree Orchestration

Worktrees are central to isolation and reproducibility.

### Lifecycle

1. Resolve repository root and git capabilities.
2. Allocate a unique branch/worktree name for the run or node.
3. Create the worktree from the configured base ref.
4. Bootstrap the worktree with optional setup hooks.
5. Lease it to a node execution.
6. Collect diff/artifacts after execution.
7. Release or retain based on policy.

### Policies

- v1 default: one worktree per run, reused by sequential nodes.
- optional mode: one worktree per node for stricter isolation.
- retention modes: `destroy`, `retainOnFailure`, `retainAlways`.
- naming: `attractor/<runId>` or `attractor/<runId>/<nodeId>`.
- lock ownership enforced via lease store to avoid duplicate usage.

### Required Port

```ts
interface WorktreeManager {
  allocate(request: AllocateWorktreeRequest): Promise<WorktreeLease>;
  prepare(
    worktreeId: WorktreeId,
    request: PrepareWorktreeRequest
  ): Promise<void>;
  get(worktreeId: WorktreeId): Promise<WorktreeLease | undefined>;
  release(worktreeId: WorktreeId, policy?: ReleasePolicy): Promise<void>;
  collectChanges(worktreeId: WorktreeId): Promise<WorktreeChanges>;
}
```

### Supporting Git Port

```ts
interface GitRepository {
  resolveRepoRoot(inputPath: string): Promise<string>;
  currentHead(repoRoot: string): Promise<string>;
  createWorktree(args: CreateWorktreeArgs): Promise<void>;
  removeWorktree(worktreePath: string, force?: boolean): Promise<void>;
  checkout(
    worktreePath: string,
    ref: string,
    createBranch?: string
  ): Promise<void>;
  status(worktreePath: string): Promise<GitStatus>;
  diff(worktreePath: string): Promise<string>;
}
```

### Failure Handling

- Allocation failure fails the run before node execution starts.
- Node failure marks the lease reusable only after cleanup succeeds.
- Cleanup errors emit warning events and may leave retained worktrees for inspection.

## Memory and Storage Layers

Use layered persistence with clear separation between metadata, event logs, and large content.

### Storage Tiers

#### Tier 1: VS Code Memento

Use `workspaceState` for tiny metadata:

- active run ids
- last opened graph
- pinned workspace settings
- lightweight indexes and migration markers

Do not store transcripts, diffs, or artifacts here.

#### Tier 2: Workspace Storage Files

Use `ExtensionContext.storageUri` or `globalStorageUri` for durable JSON/blob data:

```text
.attractor/
  runs/
    <runId>/
      run.json
      events.ndjson
      nodes/<nodeId>.json
      copilot/<nodeId>.ndjson
      artifacts/
  graphs/
    <graphId>.json
  memory/
    records.ndjson
    indexes/
  worktrees/
    leases.json
```

#### Tier 3: Derived Projections

Projection files or in-memory caches for fast UI reads:

- run summary projection
- node progress projection
- recent memory projection

### Memory Model

Memory is append-oriented and scoped.

- `workspace` memory: user preferences, durable project facts.
- `graph` memory: graph-derived summaries and normalization output.
- `run` memory: run-wide decisions, failures, outputs.
- `node` memory: prompt/response summaries, produced artifacts, local notes.

v1 retrieval should be deterministic and simple:

- filter by scope
- filter by kind/tags
- sort by recency
- summarize with explicit compaction jobs

Avoid semantic embeddings in v1 core. Keep a future extension seam for pluggable retrieval.

### Ports

```ts
interface RunRepository {
  save(run: Run): Promise<void>;
  get(runId: RunId): Promise<Run | undefined>;
  listByWorkspace(workspaceId: string): Promise<Run[]>;
}

interface EventStore {
  append(events: DomainEvent[]): Promise<void>;
  listByAggregate(aggregateId: string): Promise<DomainEvent[]>;
}

interface MemoryStore {
  append(record: MemoryRecord): Promise<void>;
  query(query: MemoryQuery): Promise<MemoryRecord[]>;
  compact(scope: MemoryScopeRef): Promise<MemoryCompactionResult>;
}

interface ArtifactStore {
  put(input: PutArtifactInput): Promise<ArtifactRef>;
  get(ref: ArtifactRef): Promise<Uint8Array>;
}
```

## Copilot Integration Surfaces

Copilot is the primary LLM provider, but the application layer should not depend directly on VS Code Copilot APIs.

### Responsibilities

- resolve model/session capability
- prepare prompt bundles from node context
- send requests and receive streaming deltas
- map Copilot errors into domain-safe failure types
- persist transcript summaries and raw deltas as optional artifacts

### Integration Surface Areas

#### `CopilotClient`

Core abstraction used by node executors.

```ts
interface CopilotClient {
  createSession(request: CreateCopilotSessionRequest): Promise<CopilotSession>;
  sendPrompt(
    sessionId: string,
    prompt: PromptEnvelope
  ): Promise<CopilotResponseStream>;
  cancel(sessionId: string): Promise<void>;
}
```

#### `PromptAssembler`

Builds prompts from graph/node/memory/worktree context.

```ts
interface PromptAssembler {
  assemble(input: AssemblePromptInput): Promise<PromptEnvelope>;
}
```

#### `ResponseInterpreter`

Normalizes model output into node artifacts, memory records, and status transitions.

```ts
interface ResponseInterpreter {
  interpret(input: InterpretResponseInput): Promise<InterpretedNodeResult>;
}
```

### v1 Surface Constraints

- Treat Copilot as a text-streaming assistant, not an autonomous tool executor.
- Tool use, if added later, must be mediated by explicit application-level adapters.
- Persist enough request/response metadata for replay and debugging, but make raw transcript retention configurable.
- If Copilot is unavailable, fail nodes with typed `ProviderUnavailableError` and preserve resumability.

## DOT Parser Scope

Attractor v1 should support a constrained DOT subset designed for execution graphs, not full Graphviz rendering semantics.

### Supported Syntax

- `digraph` only.
- node declarations with ids and attribute lists.
- directed edges `a -> b`.
- graph, node, and edge default attribute blocks.
- quoted and unquoted identifiers.
- subgraphs/clusters only as grouping metadata, not execution boundaries.
- comments and whitespace per DOT basics.

### Supported Attributes

Graph-level:

- `label`
- `concurrency`
- `baseRef`
- `worktreeMode`
- `failurePolicy`

Node-level:

- `label`
- `prompt`
- `role`
- `timeout`
- `retries`
- `memory`
- `outputs`

Edge-level:

- `label`
- `condition`
- `artifacts`

### Unsupported in v1

- undirected graphs
- HTML labels
- ports/compass routing semantics
- executable Graphviz expressions/macros
- layout-only attributes affecting orchestration
- arbitrary attribute inheritance beyond normalized defaults

### Parser Output Contract

```ts
interface GraphParseResult {
  graph: TaskGraph;
  diagnostics: GraphDiagnostic[];
}

interface GraphParser {
  parse(input: ParseGraphInput): Promise<GraphParseResult>;
}
```

### Validation Rules

- graph must be directed and non-empty
- node ids must be unique after normalization
- executable dependency graph must be acyclic
- all edge endpoints must resolve to declared nodes
- known attributes are parsed strongly; unknown attributes preserved in metadata
- missing required execution data becomes a validation diagnostic

## Application APIs and Interfaces

Keep the public backend API narrow and task-oriented. The extension layer should mostly call application services through commands and queries.

### Commands

```ts
interface CreateRunCommand {
  workspaceId: string;
  graphSource: string;
  trigger: "command" | "resume" | "test";
}

interface StartRunCommand {
  runId: RunId;
}

interface CancelRunCommand {
  runId: RunId;
  reason?: string;
}

interface AppendMemoryCommand {
  scope: MemoryScopeRef;
  kind: MemoryKind;
  content: MemoryContent;
  tags?: string[];
}
```

### Queries

```ts
interface GetRunQuery {
  runId: RunId;
}

interface ListRunsQuery {
  workspaceId: string;
}

interface QueryMemory {
  scope?: MemoryScopeRef;
  tags?: string[];
  kinds?: MemoryKind[];
  limit?: number;
}
```

### Facade

```ts
interface AttractorBackend {
  createRun(command: CreateRunCommand): Promise<{ runId: RunId }>;
  startRun(command: StartRunCommand): Promise<void>;
  cancelRun(command: CancelRunCommand): Promise<void>;
  getRun(query: GetRunQuery): Promise<RunView | undefined>;
  listRuns(query: ListRunsQuery): Promise<RunListItemView[]>;
  queryMemory(query: QueryMemory): Promise<MemoryRecord[]>;
  subscribe(listener: (event: DomainEvent) => void): Disposable;
}
```

### Scheduler and Executor Seams

```ts
interface RunScheduler {
  enqueue(runId: RunId): Promise<void>;
  resume(runId: RunId): Promise<void>;
  cancel(runId: RunId): Promise<void>;
}

interface NodeExecutor {
  execute(input: ExecuteNodeInput): Promise<NodeExecutionResult>;
}
```

## Recommended Execution Flow

1. User triggers `createRun` with DOT source.
2. `GraphParser` parses and validates into `TaskGraph`.
3. `RunFactory` creates `Run` with blocked/ready node states.
4. `RunScheduler` enqueues run and emits `run.queued`.
5. `RunOrchestrator` allocates a worktree and starts ready nodes.
6. `NodeExecutor` assembles prompt, invokes `CopilotClient`, interprets response.
7. Artifacts and memory are persisted; dependent nodes become ready.
8. Run completes, fails, or cancels; projections are updated.
9. Worktree retention policy is applied.

## Error Model

Use typed errors at port boundaries and map them to stable failure categories.

Suggested categories:

- `ValidationError`
- `ConcurrencyError`
- `WorktreeError`
- `GitError`
- `ProviderUnavailableError`
- `PromptAssemblyError`
- `PersistenceError`
- `CancellationError`

Rules:

- ports throw typed infrastructure errors
- application layer maps them to run/node failure states
- user-facing adapters consume failure categories, not raw stack traces

## Testing Seams

The design should make nearly all orchestration testable without VS Code.

### Unit Tests

- `domain` invariants for graph validation, run transitions, retry policy.
- parser normalization and diagnostic behavior using DOT fixtures.
- prompt assembly and response interpretation.
- memory query and compaction rules.

### Contract Tests

- `GitRepository` adapter against temp repos.
- `WorktreeManager` lifecycle against disposable worktree fixtures.
- `FilesystemStorage` read/write and recovery behavior.
- `CopilotClient` contract tests with a fake streaming provider.

### Integration Tests

- create-run to completion with fake git and fake Copilot.
- resume after extension restart using persisted run state.
- cancellation during streamed Copilot response.
- retain-on-failure worktree inspection path.

### Test Doubles to Provide

```ts
interface FakeClock {
  now(): string;
}
interface FakeIdGenerator {
  next(): string;
}
interface InMemoryEventStore extends EventStore {}
interface InMemoryRunRepository extends RunRepository {}
interface FakeCopilotClient extends CopilotClient {}
interface FakeGitRepository extends GitRepository {}
```

### Recommended Testkit Utilities

- graph builders for common DAG shapes
- run builders with node states preconfigured
- DOT fixture loader with expected diagnostics
- event capture helper for asserting orchestration sequences
- temp workspace/worktree harness

## Configuration Surface

Keep configuration small and backend-relevant.

```ts
interface AttractorConfig {
  baseRef: string;
  maxParallelNodes: number;
  worktreeMode: "per-run" | "per-node";
  worktreeRetention: "destroy" | "retainOnFailure" | "retainAlways";
  transcriptRetention: "off" | "errorsOnly" | "all";
  storageLocation: "workspace" | "global";
}
```

Resolution order:

1. graph attributes
2. workspace settings
3. extension defaults

## Versioning and Migrations

- Add `schemaVersion` to persisted run, graph, and memory files.
- Keep parser version in `GraphSource` to support reparse diagnostics.
- Use explicit migration functions per storage type.
- Prefer additive changes to event payloads; never reuse event names for new semantics.

## v1 Implementation Priorities

1. Pure domain model and typed contracts.
2. DOT parser plus validator for the constrained subset.
3. Run orchestrator with sequential execution.
4. Git/worktree manager with per-run isolation.
5. File-backed run/event/memory stores.
6. Copilot adapter with streaming text support.
7. Projection layer for simple status views.
8. Resume/cancel flows and retention policies.

## Open Extension Points After v1

- parallel scheduler with resource-aware worktree pooling
- pluggable memory retrieval, including embeddings/vector search
- additional model providers behind `CopilotClient`-like abstraction
- richer node types such as analysis-only or shell-assisted execution
- remote execution or background task workers outside the extension host

## Recommended Initial File Ownership

- `src/domain/**`: entities, policies, events, pure validation
- `src/application/**`: use cases, orchestration, ports, projections
- `src/infrastructure/parser/**`: DOT parser and normalization
- `src/infrastructure/git/**`: git and worktree adapters
- `src/infrastructure/storage/**`: file and memento persistence
- `src/infrastructure/copilot/**`: Copilot session and streaming adapter
- `src/extension/**`: activation and dependency injection only

This architecture keeps Attractor v1 simple enough for a VS Code extension host while preserving clear seams for testing, resumability, and future backend growth.
