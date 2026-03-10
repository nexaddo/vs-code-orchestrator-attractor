# VS Code Attractor

Repository planning workspace for a VS Code extension that implements Attractor-style orchestration with the Copilot SDK.

## Current Focus

- Define the repository scaffold, delivery pipeline, and testing strategy
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

1. Scaffold the workspace and package manifests
2. Implement shared contracts and schema tests first
3. Build the first vertical slice: repo -> plan -> run -> timeline -> graph
4. Add the `@attractor` Copilot participant and role-specific prompt packets
