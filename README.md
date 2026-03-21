# VS Code Attractor

Repository planning workspace for a VS Code extension that implements Attractor-style orchestration with the Copilot SDK.

## Current Focus

- **M3 (First Dashboard Slice) is complete** — all 4 lanes merged (PRs #11–14). `main` is at `9301d9a`.
- M0, M1, M2, and M3 milestones are fully shipped
- Keep v1 scoped to one writable repository per plan, with additional read-only context repositories
- Defer `parallel`, `fan_in`, `tool`, and `manager_loop` to v1.1

## Milestone Status

| Milestone                  | Status    | Notes                                                                                                     |
| -------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| M0 — Scaffold              | ✅ MERGED | Tooling, CI, workspace                                                                                    |
| M1 — First Slices          | ✅ MERGED | Contracts, webview shell, runtime spine (PRs #1–5)                                                        |
| M2 — Backend Spine         | ✅ MERGED | Shared contracts, DOT validator, event log, worktree manager, snapshot projector (PRs #6–10)              |
| M3 — First Dashboard Slice | ✅ MERGED | Storage read surface, overview projection, webview shell, bridge + runtime wiring (PRs #11–14, `9301d9a`) |

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

M4 planning — no next milestone defined yet. M3 is fully shipped.
