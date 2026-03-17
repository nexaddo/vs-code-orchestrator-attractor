# VS Code Attractor

Repository planning workspace for a VS Code extension that implements Attractor-style orchestration with the Copilot SDK.

## Current Focus

- **M2 (Backend Spine) is complete** — all 5 lanes merged to `main` at `0149062`
- M0, M1, and M2 milestones are fully shipped
- Next: M3 planning (runner execution loop, webview integration, CLI surface)
- Keep v1 scoped to one writable repository per plan, with additional read-only context repositories
- Defer `parallel`, `fan_in`, `tool`, and `manager_loop` to v1.1

## Milestone Status

| Milestone          | Status         | Notes                                                                                        |
| ------------------ | -------------- | -------------------------------------------------------------------------------------------- |
| M0 — Scaffold      | ✅ MERGED      | Tooling, CI, workspace                                                                       |
| M1 — First Slices  | ✅ MERGED      | Contracts, webview shell, runtime spine (PRs #1–5)                                           |
| M2 — Backend Spine | ✅ MERGED      | Shared contracts, DOT validator, event log, worktree manager, snapshot projector (PRs #6–10) |
| M3 — Runner Loop   | 🔲 Not started |                                                                                              |

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

1. Plan M3 milestone from `docs/plans/roadmap.md`
2. Define M3 lanes: runner execution loop, webview integration, CLI surface
3. Continue parallel-lane approach with worktrees and drift reviews at each loop end
