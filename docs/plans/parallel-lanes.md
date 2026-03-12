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

#### Current Lane 3 Slice

- consume exactly one outbound message type: `overview.state`
- decode a typed overview payload into a local read model
- render only:
  - `WorkspaceSummaryCard`
  - `RepositoryListPanel`
- keep rendering read-only and static for this slice
- no inbound commands, no runtime bridge wiring, no graph, no timeline, no run actions

#### Implemented Lane 3 Modules

- `packages/webview/src/overview/model.ts`
- `packages/webview/src/overview/decoder.ts`
- `packages/webview/src/overview/renderer.ts`
- `packages/webview/src/overview/index.ts`
- `packages/webview/test/overview/decoder.test.ts`
- `packages/webview/test/overview/renderer.test.ts`
- `packages/webview/vitest.config.ts`
- `test/fixtures/webview/overview/**`

#### Next Lane 3 Follow-Up Slices

- isolate and fix any review feedback on decoder error handling without widening the slice
- add empty-state rendering coverage for:
  - no repositories configured
  - repositories present but no active runs
- add a thin shell wrapper entrypoint that can host the overview markup without introducing runtime bridge logic yet
- defer `ActiveRunsPanel`, `RecentFailuresPanel`, actions, and page chrome until a second webview slice

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
