# Architecture

## Overview

Attractor is a VS Code extension split into three packages:

```
@attractor/shared      — Zod-validated contracts (schemas, message types)
@attractor/extension   — VS Code extension host (backend)
@attractor/webview     — VS Code webview (dashboard UI)
```

Dependency direction: `extension` → `shared` ← `webview`. No circular deps.

---

## Backend: Extension Host

### Layered Architecture

```
┌─────────────────────────────────┐
│  Extension  (activation, DI)    │  src/extension.ts, src/runtime.ts
├─────────────────────────────────┤
│  Application (orchestration)    │  src/application/
├─────────────────────────────────┤
│  Infrastructure (adapters)      │  src/infrastructure/
├─────────────────────────────────┤
│  Domain (pure business rules)   │  src/domain/
└─────────────────────────────────┘
```

Rules:

- **Domain** has zero external dependencies (no VS Code, no filesystem)
- **Application** depends only on Domain + port interfaces (no concrete infra)
- **Infrastructure** implements port interfaces using external APIs
- **Extension** is the DI composition root — wires everything together

### Domain Layer (`src/domain/`)

Pure value objects and domain event types. No I/O.

- `value-objects.ts` — `RunId`, `WorktreeId`, typed ID wrappers
- `events.ts` — `DomainEvent<TPayload>` envelope interface

### Application Layer (`src/application/`)

Business logic as orchestration policies and command handlers.

- `ports.ts` — port interfaces (`RunRepository`, `EventLog`, `WorktreeManager`, `ModelGateway`, …)
- `run-command-handler.ts` — `startRun()`: allocates a worktree, creates a run record, appends a started event
- `orchestration-loop.ts` — graph traversal: resolves ready nodes, dispatches each to the LLM, posts handoffs
- `role-prompts.ts` — per-role system prompts (architect, implementer, reviewer, …)

### Infrastructure Layer (`src/infrastructure/`)

Concrete implementations of application ports.

| Subdirectory | Implements                                                           |
| ------------ | -------------------------------------------------------------------- |
| `storage/`   | `RunRepository`, `EventLog`, `GraphRepository`, `WorktreeLeaseStore` |
| `registry/`  | `RepositoryRegistry`                                                 |
| `dot/`       | DOT graph parser → `ParsedGraph`                                     |
| `git/`       | `WorktreeManager` — git worktree lifecycle                           |
| `copilot/`   | `ModelGateway` — Copilot LLM `send`/`stream`                         |
| `chat/`      | VS Code chat participant (`@attractor`)                              |
| `webview/`   | `WebviewBridge` — posts messages to the dashboard panel              |

### Persistence Tiers

| Tier | Store                 | Path                                                                                                                                     |
| ---- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | VS Code Memento       | Extension state                                                                                                                          |
| 2    | Filesystem            | `.attractor/runs/<id>/run.json`, `.attractor/runs/<id>/events.ndjson`, `.attractor/graphs/<id>.json`, `.attractor/worktrees/leases.json` |
| 3    | In-memory projections | Rebuilt from snapshots + event replay                                                                                                    |

---

## Event Sourcing

All state transitions produce immutable event envelopes:

```ts
interface DomainEvent<TPayload = unknown> {
  id: string; // UUID
  name: string; // e.g. "run.started"
  aggregateType: string;
  aggregateId: string;
  correlationId: string;
  timestamp: string; // ISO 8601
  payload: TPayload;
}
```

Events are appended to `.attractor/runs/<id>/events.ndjson`. The current state of any aggregate is derived by replaying its events from the last snapshot. No events are ever mutated or deleted.

---

## Worktree Lifecycle

Each run is isolated in a dedicated git worktree named `attractor/<runId>`:

```
allocate → prepare → busy → release → destroy | retain
```

- **allocate**: create the worktree and write a lease to `leases.json`
- **prepare**: checkout the correct base branch
- **busy**: locked while the orchestration loop is executing
- **release**: unlock; loop complete (success or failure)
- **destroy**: remove worktree if run is discarded; **retain** if artifacts should be preserved

Lease ownership is enforced by `WorktreeLeaseStore`. A worktree may not be claimed by two runs simultaneously.

---

## Webview Dashboard

The dashboard webview renders read-only inspectors for:

| View                 | Data source                       |
| -------------------- | --------------------------------- |
| Overview             | Repository registry summary       |
| Repository inspector | `RepositoryRecord`                |
| Plan inspector       | `PlanRecord` + `GraphRecord`      |
| Run inspector        | `RunRecord` + orchestration state |
| Timeline             | Event log replay                  |
| Graph                | DOT graph rendered as SVG         |

All webview↔extension communication uses typed `WebviewMessage` contracts defined in `@attractor/shared`. Messages are Zod-validated on both sides.

---

## Copilot Orchestration (M4)

The orchestration loop dispatches graph nodes to the Copilot LLM via `ModelGateway`:

1. Resolve which nodes are ready (all predecessors complete)
2. Build a role prompt for the node's assigned agent role
3. Call `ModelGateway.stream()` with the prompt + context
4. Parse the LLM response for a handoff artifact
5. Mark the node done; append a `node.completed` domain event
6. Repeat until the terminal node is reached

The chat participant (`@attractor`) exposes natural-language control over runs from the VS Code Chat panel.

---

## Contracts

All persisted and cross-boundary payloads are Zod-validated schemas in `@attractor/shared`, versioned at `CONTRACT_VERSION = 1`. Schema: `RunRecord`, `PlanRecord`, `GraphRecord`, `RepositoryRecord`, `WorktreeLease`, `EventEnvelope`, `WebviewMessage`.

Add schemas to `@attractor/shared` before implementing consumers. Never pass untyped JSON across package or storage boundaries.
