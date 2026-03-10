# VS Code Attractor

Repository planning workspace for a VS Code extension that implements Attractor-style orchestration with the Copilot SDK.

## Current Focus

- M0 scaffold is complete and committed on `main`
- M1 prep is in progress: parallel lane definition, drift control, and first contract/runtime/webview slices
- Define the backend architecture, contracts, and persistence model
- Define the v1 repository-first dashboard and first mockups
- Keep v1 scoped to one writable repository per plan, with additional read-only context repositories
- Defer `parallel`, `fan_in`, `tool`, and `manager_loop` to v1.1

## Planning Docs

- `docs/plans/repository-scaffold.md`
- `docs/plans/roadmap.md`
- `docs/architecture/backend-architecture.md`
- `docs/architecture/contracts.md`
- `docs/testing-strategy.md`
- `docs/ui-design.md`
- `docs/ui-mockups.md`
- `docs/reviews/ui-review-notes.md`
- `docs/adrs/ADR-0001-thin-vertical-slice.md`

## Workflow Artifacts

- `artifacts/task-packs/template.md`
- `artifacts/handoffs/template.md`
- `docs/reviews/template.md`

## Near-Term Next Steps

1. Start the first parallel lanes with worktrees and feature branches
2. Tighten shared contracts for plans, runs, milestones, and events
3. Build the first runtime spine and webview shell slices in parallel
4. Add a drift-review pass at the end of each loop to keep implementation aligned with the plan
