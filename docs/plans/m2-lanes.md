# M2 Implementation Lanes

> Assumption: M2 ships the new backend primitives and minimal composition points, not new commands, runner behavior, or webview features.

## Bottom Line

Split M2 into five lanes: one shared-contract foundation lane, one fully independent DOT-validation lane, two parallel infrastructure lanes for event logging and worktree management, and a final snapshot-projector lane that merges after the event log is stable. This keeps `packages/shared/src/contracts/index.ts` and `packages/extension/src/storage/services.ts` single-owner files, which is the main risk to safe parallelism.

**Effort estimate:** Medium (1–2 days with parallel work)

> Branch names below are for implementation lanes. Runtime-created git worktree branches use `attractor/<session-short>/<repo-short>/a<attempt>`.

## Lane Summary

| Lane                                  | Branch                     | Scope                                                     | Depends on                      | Status                   |
| ------------------------------------- | -------------------------- | --------------------------------------------------------- | ------------------------------- | ------------------------ |
| Lane 00 — Shared contracts foundation | `m2/00-shared-contracts`   | Add all M2 shared Zod schemas and exports                 | None                            | MERGED (PR #6, 7ffdbe3)  |
| Lane 10 — DOT validation pipeline     | `m2/10-dot-validator`      | Parse DOT and validate v1 node subset                     | None                            | MERGED (PR #7, 039e962)  |
| Lane 20 — Event log storage           | `m2/20-event-log`          | `EventLog` interface + JSONL file implementation per run  | Lane 00                         | MERGED (PR #8, ec7af5c)  |
| Lane 30 — Worktree manager skeleton   | `m2/30-worktree-manager`   | `WorktreeManager` skeleton with acquire/release/reconcile | Lane 00                         | MERGED (PR #9, 0a8c0b8)  |
| Lane 40 — Snapshot projector          | `m2/40-snapshot-projector` | `SnapshotProjector` + storage composition wiring          | Lane 00, then Lane 20 for merge | MERGED (PR #10, 0149062) |

## Lane Details

### Lane 00 — Shared Contracts Foundation

**Branch:** `m2/00-shared-contracts`

**Scope**

- Update `packages/shared/src/contracts/index.ts`.
- Add:
  - `ExtensionEventSchema`
  - `WorktreeLeaseSchema`
  - `MilestoneRecordSchema`
  - `RunSnapshotSchema`
- Export inferred types alongside schemas.
- Add valid/invalid fixtures under `test/fixtures/contracts/`.
- Add schema tests.

**Acceptance criteria**

- `packages/shared` builds with all four new schemas exported from the existing contracts entrypoint.
- Each schema has at least one valid fixture test and one invalid fixture test.
- `RunSnapshotSchema` models current run status plus current milestone and last checkpoint as projected read-model data.
- This lane does not add extension behavior beyond shared contract definitions.

**Schema order inside this lane (to unblock parallel lanes fastest)**

1. `ExtensionEventSchema` — unblocks Lane 20 and Lane 40
2. `WorktreeLeaseSchema` — unblocks Lane 30
3. `MilestoneRecordSchema` — establishes milestone shape
4. `RunSnapshotSchema` — safely references milestone/read-model fields after the above

---

### Lane 10 — DOT Validation Pipeline

**Branch:** `m2/10-dot-validator`

**Scope**

- Implement `packages/extension/src/graph/dot-validator.ts`.
- Parse DOT with `@ts-graphviz/parser` (add to extension package.json if not present).
- Validate only the v1 subset: `start`, `exit`, `codergen`, `conditional`, `wait.human`.
- Keep result types local to the extension package (no shared contract changes).

**Acceptance criteria**

- `validate(source: string): ValidationResult` succeeds for a valid graph using only allowed node types.
- Missing `start`, missing `exit`, unsupported node type, and unreachable node each return typed diagnostics.
- Parse failures are returned as validation diagnostics, not uncaught exceptions.
- Unit tests cover valid graph, each error class, and edge cases (empty source, disconnected subgraph).
- This lane does not add graph execution, graph transformation, or support for node types outside the v1 subset.

---

### Lane 20 — Event Log Storage

**Branch:** `m2/20-event-log`

**Scope**

- Define `EventLog` interface in `packages/extension/src/storage/events/index.ts`.
- Implement `packages/extension/src/storage/events/file-event-log.ts`.
- Use append-only JSONL at `storage/runs/<run-id>/events.jsonl`.
- Consume `ExtensionEventSchema` from shared contracts (depends on Lane 00).

**Acceptance criteria**

- `append(event)` creates the parent directory/file if missing and appends exactly one JSON line per call.
- `listByRun(runId)` returns `ExtensionEvent[]` in append order.
- `listByRun(runId)` returns an empty array when the run has no log yet.
- Reads validate lines with `ExtensionEventSchema`; malformed or schema-invalid lines fail explicitly rather than being skipped silently.
- Unit tests cover: empty log, single append, multiple appends in order, malformed line rejection.
- This lane does not wire the event log into `createStorageServices()` — that is owned by Lane 40.

---

### Lane 30 — Worktree Manager Skeleton

**Branch:** `m2/30-worktree-manager`

**Scope**

- Define `WorktreeManager` interface in `packages/extension/src/worktrees/index.ts`.
- Implement `packages/extension/src/worktrees/worktree-manager.ts`.
- Shell out to `git` through a thin Node `child_process` wrapper.
- Consume `WorktreeLeaseSchema` from shared contracts (depends on Lane 00).

**Acceptance criteria**

- `acquire(input)` creates a git worktree on branch `attractor/<session-short>/<repo-short>/a<attempt>` and returns a schema-valid `WorktreeLease`.
- `release(leaseId)` removes a worktree created by this manager and fails predictably for an unknown lease id.
- `reconcile()` reports known vs. actual git worktrees without mutating unrelated git state (read-only in M2).
- Unit tests cover acquire, release, and reconcile using a fixture/temporary repo.
- This lane does not add commit, push, auto-repair, or adoption of pre-existing arbitrary worktrees.

---

### Lane 40 — Snapshot Projector

**Branch:** `m2/40-snapshot-projector`

**Scope**

- Define `SnapshotProjector` interface in `packages/extension/src/storage/snapshots/index.ts`.
- Implement `packages/extension/src/storage/snapshots/snapshot-projector.ts`.
- Project `RunSnapshot` from event stream via `EventLog.listByRun()`.
- Own the `packages/extension/src/storage/services.ts` composition change to expose event log and projector.

**Acceptance criteria**

- `project(runId)` reads events through `EventLog.listByRun(runId)` and derives latest run status, current milestone id, and last checkpoint.
- Absent milestone or checkpoint events return empty/null values as defined by `RunSnapshotSchema`; no inference from plan/run files.
- Projection is deterministic for a fixed ordered event sequence, covered by unit tests.
- `createStorageServices()` exposes event log and projector alongside existing registries.
- This lane does not add live subscriptions, caching, or webview updates.

---

## Dependencies

### Hard dependencies

- **Lane 00** must land before **Lane 20**, **Lane 30**, and **Lane 40**.
- **Lane 20** must land before **Lane 40** is merged (projector depends on stable `EventLog` shape + composition).

### No dependency

- **Lane 10** is independent — keeps validator result types local to the extension.

## Safe Parallelism

### Wave 1 — safe immediately

- **Lane 00** and **Lane 10** can run at the same time.

### Wave 2 — safe after Lane 00 merges

- **Lane 20** and **Lane 30** can run at the same time.

### Wave 3 — safest after Lane 20 is stable

- **Lane 40** can start once Lane 00 lands, but the safest merge path is after Lane 20 merges.

## Recommended Merge Order

1. `m2/00-shared-contracts`
2. `m2/10-dot-validator`
3. `m2/20-event-log`
4. `m2/30-worktree-manager`
5. `m2/40-snapshot-projector`

## Watch Out For

1. **Single-owner files:** keep `contracts/index.ts` owned by Lane 00 and `storage/services.ts` owned by Lane 40 to avoid merge churn.
2. **Event typing drift:** projector logic should consume `ExtensionEventSchema`-backed types directly; do not recreate event unions locally.
3. **Worktree safety:** keep `reconcile()` read-only in M2 so the skeleton cannot accidentally delete a developer worktree.
