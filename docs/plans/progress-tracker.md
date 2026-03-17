# Progress Tracker

This file tracks completed phases, current work, and the next intended handoff so progress is visible between sessions.

## Completed

### M0.1 - Project Memory And Model Routing

- Added project OpenCode config and instructions in `opencode.json`
- Added project routing rules in `AGENTS.md`
- Added explicit subagents in `.opencode/agents/`
- Added model routing notes in `docs/architecture/model-routing.md`

### M0.2 - Workspace Scaffold Created

- Added root workspace files: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `tsconfig.json`
- Added formatting and lint config: `eslint.config.mjs`, `.prettierrc.json`, `.gitignore`
- Added CI skeleton in `.github/workflows/ci.yml`
- Added initial `packages/shared`, `packages/extension`, and `packages/webview`
- Added placeholder fixtures, scripts, and test directories

### M0.3 - Progress Tracking And Thin-Slice Alignment

- Added `docs/plans/progress-tracker.md`
- Closed the initial CI/tooling gaps found in review
- Tightened the first shared contract boundaries enough to avoid immediate doc drift

### M0.4 - Install And Stabilize

- Installed dependencies with `pnpm install`
- Generated and committed `pnpm-lock.yaml`
- Made `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass

### M0.5 - Review Hardening

- Ran primary and secondary review passes against the scaffold
- Tightened the first contract slice and aligned CI/docs with the implemented baseline

### M0.6 - Commit And Push

- Committed the scaffold baseline to `main`
- Pushed `main` to `origin/main`

### M1 - First Parallel Lanes (all merged)

- **PR #1** (`feat/m1-shared-contracts-core`): Lane 1 — Shared Contracts Core merged
- **PR #2** (`chore/m0-test-ci-hardening`): Lane 2 — CI Hardening merged
- **PR #3** (webview shell): Lane 3 — Webview Shell merged
- **PR #5** (extension runtime spine): Lane 4 — Extension Runtime Spine merged at `b28634d`

### M2 Wave 1 — Contracts + DOT Validator (both merged, 2026-03-17)

- **PR #6** (`m2/00-shared-contracts`): Lane 00 — Shared Contracts Foundation merged at `7ffdbe3`
  - Added `ExtensionEventSchema`, `WorktreeLeaseSchema`, `MilestoneRecordSchema`, `RunSnapshotSchema`
  - 85/85 tests; typecheck and lint clean
- **PR #7** (`m2/10-dot-validator`): Lane 10 — DOT Validation Pipeline merged at `039e962`
  - Implemented `validateDot()` with `@ts-graphviz/parser`
  - Diagnostics: missing-start, missing-exit, unsupported-node-type, unreachable-node, parse-error
  - 87/87 tests; typecheck and lint clean
- `main` is now at `039e962`

## In Progress

### M2 Wave 2 — Event Log + Worktree Manager

Current focus:

- **Lane 20** (`m2/20-event-log`): `EventLog` interface + JSONL file implementation per run
- **Lane 30** (`m2/30-worktree-manager`): `WorktreeManager` skeleton with acquire/release/reconcile

Both lanes depend on Lane 00 (now merged). They can run in parallel.

Active worktrees:

- `C:/_git/vs-code-orchestrator-attractor-lane20` → `m2/20-event-log`
- `C:/_git/vs-code-orchestrator-attractor-lane30` → `m2/30-worktree-manager`

## Next Up

### M2 Wave 2 — Lane Details

**Lane 20 — Event Log Storage**

- Define `EventLog` interface in `packages/extension/src/storage/events/index.ts`
- Implement `packages/extension/src/storage/events/file-event-log.ts`
- Use append-only JSONL at `storage/runs/<run-id>/events.jsonl`
- Consume `ExtensionEventSchema` from shared contracts

**Lane 30 — Worktree Manager Skeleton**

- Define `WorktreeManager` interface in `packages/extension/src/worktrees/index.ts`
- Implement `packages/extension/src/worktrees/worktree-manager.ts`
- Shell out to `git` through a thin Node `child_process` wrapper
- Consume `WorktreeLeaseSchema` from shared contracts

### M2 Wave 3 — Snapshot Projector

**Lane 40** can start once Lane 00 merges (done); safest merge is after Lane 20.

- Define `SnapshotProjector` in `packages/extension/src/storage/snapshots/`
- Project `RunSnapshot` from event stream via `EventLog.listByRun()`
- Wire into `createStorageServices()` in `packages/extension/src/storage/services.ts`

## Session Resume Note

If a future session resumes here, start from **M2 Wave 2** (Lane 20 and Lane 30).
Both Wave 1 lanes are merged. Wave 2 worktrees are at:

- `C:/_git/vs-code-orchestrator-attractor-lane20` → `m2/20-event-log`
- `C:/_git/vs-code-orchestrator-attractor-lane30` → `m2/30-worktree-manager`
