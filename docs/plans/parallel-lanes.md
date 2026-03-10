# First Parallel Lanes

This plan marks the first safe split from the M0 scaffold baseline into parallel implementation work.

## Preconditions

- `main` contains the M0 scaffold baseline
- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, and `pnpm test` are green
- drift between the scaffold and plan docs has been corrected to a workable baseline

## Lanes

### Lane 1 - Shared Contracts Core

- scope: `packages/shared`, contract fixtures, contract tests, touched contract docs only
- branch: `feat/m1-shared-contracts-core`
- worktree: `wt/m1-shared-contracts`
- acceptance: versioned plan/run-related schemas, fixtures, and passing contract tests

### Lane 2 - Test And CI Hardening

- scope: root tooling, CI workflows, test harness stability only
- branch: `chore/m0-test-ci-hardening`
- worktree: `wt/m0-test-ci`
- acceptance: clean-clone reliability and green baseline preserved for all lanes

### Lane 3 - Webview Shell Slice

- scope: `packages/webview` only, consuming shared contracts
- branch: `feat/m1-webview-shell`
- worktree: `wt/m1-webview-shell`
- acceptance: read-only overview shell with typed outbound state consumption

### Lane 4 - Extension Runtime Spine

- scope: `packages/extension` only, consuming shared contracts
- branch: `feat/m1-extension-runtime-spine`
- worktree: `wt/m1-extension-spine`
- acceptance: storage layout and repository registry seams with deterministic tests

## Dependencies

- Lane 2 is independent and should land first
- Lane 1 is independent after M0 and should land second
- Lane 3 depends on Lane 1 shared message contracts being stable
- Lane 4 depends on Lane 1 shared runtime contracts being stable

## Merge Order

1. `chore/m0-test-ci-hardening`
2. `feat/m1-shared-contracts-core`
3. `feat/m1-extension-runtime-spine`
4. `feat/m1-webview-shell`

## Drift Control

- run `@plan-drift-reviewer` at the end of each lane loop
- update `docs/plans/progress-tracker.md` when a lane changes phase status
- do not widen a lane beyond its stated acceptance criteria without recording the change in docs first
