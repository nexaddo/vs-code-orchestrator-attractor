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

## In Progress

### M1 Prep - First Parallel Lanes

Current focus:

- capture the first parallel lane plan in repo docs
- add a dedicated drift-review agent spec for end-of-loop checks
- prepare worktree/branch boundaries for the first concurrent slices

Known issues to address next:

- split work into safe parallel lanes without widening the v1 scope
- keep docs and implemented contracts synchronized as lanes start
- add the first drift review artifact after lane kickoff

### M1.1 - Parallel Lane Kickoff

Active worktrees:

- `C:\_git\wt-m0-test-ci` -> `chore/m0-test-ci-hardening`
- `C:\_git\wt-m1-shared-contracts` -> `feat/m1-shared-contracts-core`

First commit-sized slices:

- lane 2: add a `ci:fast-checks` source-of-truth script plus a workflow drift meta test
- lane 1: add `PlanRepositoryRef` and `PlanRecord` shared contract schemas plus fixtures/tests

## Next Up

### Lane 1 - Shared Contracts Core

- tighten `PlanRecord`, `PlanRepositoryRef`, and `RunRecord`
- add valid and invalid fixtures
- keep the one-writable-repo rule enforced in schemas

### Lane 2 - Test And CI Hardening

- keep root tooling stable under parallel development
- make sure branch work stays green on lint/typecheck/test

### Lane 3 - Webview Shell

- add a read-only overview shell
- consume typed outbound state messages only

### Lane 4 - Extension Runtime Spine

- add storage layout and repository registry seams
- keep runtime pure and testable

## Planned After M0

### Post-Lane Merge Order

- lane 2: test and CI hardening
- lane 1: shared contracts
- lane 4: extension runtime spine
- lane 3: webview shell

## Session Resume Note

If a future session resumes here, start from `M1 Prep - First Parallel Lanes` unless this file says otherwise.
