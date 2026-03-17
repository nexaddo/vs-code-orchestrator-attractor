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

### M2 — Backend Spine (all 5 lanes merged, 2026-03-17)

- **PR #6** (`m2/00-shared-contracts`): Lane 00 — Shared Contracts Foundation merged at `7ffdbe3`
  - Added `ExtensionEventSchema`, `WorktreeLeaseSchema`, `MilestoneRecordSchema`, `RunSnapshotSchema`
  - 85/85 tests; typecheck and lint clean
- **PR #7** (`m2/10-dot-validator`): Lane 10 — DOT Validation Pipeline merged at `039e962`
  - Implemented `validateDot()` with `@ts-graphviz/parser`
  - Diagnostics: missing-start, missing-exit, unsupported-node-type, unreachable-node, parse-error
  - 87/87 tests; typecheck and lint clean
- **PR #8** (`m2/20-event-log`): Lane 20 — FileEventLog merged at `ec7af5c`
  - Append-only JSONL event log; `append()`, `listByRun()` with schema validation
  - 108/108 tests; typecheck and lint clean
- **PR #9** (`m2/30-worktree-manager`): Lane 30 — GitWorktreeManager merged at `0a8c0b8`
  - In-memory worktree lease manager with acquire/release/reconcile
  - 107/107 tests; typecheck and lint clean
- **PR #10** (`m2/40-snapshot-projector`): Lane 40 — SnapshotProjector + services wiring merged at `0149062`
  - Event-sourced `EventLogSnapshotProjector`; `eventLog` + `snapshotProjector` wired into `StorageServices`
  - 125/125 tests; typecheck and lint clean
- `main` is now at `0149062`

## In Progress

### M3 — First Dashboard Slice (planning complete, implementation not started)

Plan: `docs/plans/m3-lanes.md` — 4 lanes, 2 parallelism waves.

| Lane                            | Branch                        | Status  |
| ------------------------------- | ----------------------------- | ------- |
| L1 — Storage read surface       | `m3/storage-read-surface`     | pending |
| L2 — Overview projection        | `m3/overview-projection`      | pending |
| L3 — Webview overview shell     | `m3/webview-overview-shell`   | pending |
| L4 — Dashboard bridge + runtime | `m3/dashboard-bridge-runtime` | pending |

**Wave 1 (parallel):** L1 + L3  
**Wave 2:** L2 (after L1)  
**Wave 3:** L4 (after L2 + L3)

## Next Up

Start M3 Wave 1:

- Create worktrees for L1 (`m3/storage-read-surface`) and L3 (`m3/webview-overview-shell`) in parallel
- Each lane must pass `pnpm typecheck`, `pnpm lint`, `pnpm test` before PR

## Session Resume Note

If a future session resumes here, **M2 is complete** and **M3 is planned but not started**.
Lane plan is at `docs/plans/m3-lanes.md`. Start with Wave 1: L1 and L3 in parallel worktrees.
