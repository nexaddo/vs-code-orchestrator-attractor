# VS Code Attractor

Repository planning workspace for a VS Code extension that implements Attractor-style orchestration with the Copilot SDK.

## Current Focus

- **M3 (First Dashboard Slice) Wave 1 is complete** — L1 (storage read surface, PR #11) and L3 (webview overview shell, PR #12) merged to `main` at `6d8af13`
- M0, M1, and M2 milestones are fully shipped
- Next: M3 Wave 2 — L2 overview projection (`m3/overview-projection`)
- Keep v1 scoped to one writable repository per plan, with additional read-only context repositories
- Defer `parallel`, `fan_in`, `tool`, and `manager_loop` to v1.1

## Milestone Status

| Milestone                  | Status         | Notes                                                                                        |
| -------------------------- | -------------- | -------------------------------------------------------------------------------------------- |
| M0 — Scaffold              | ✅ MERGED      | Tooling, CI, workspace                                                                       |
| M1 — First Slices          | ✅ MERGED      | Contracts, webview shell, runtime spine (PRs #1–5)                                           |
| M2 — Backend Spine         | ✅ MERGED      | Shared contracts, DOT validator, event log, worktree manager, snapshot projector (PRs #6–10) |
| M3 — First Dashboard Slice | 🔄 In Progress | L1 + L3 merged (PRs #11–12); L2 and L4 pending                                               |

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

1. M3 Wave 2: worktree for `m3/overview-projection` (L2) — pure `projectOverview(services)` function
2. L2 merged → unblocks L4 (`m3/dashboard-bridge-runtime`)
3. L4 wires `ready` → projection → `overview.state` end-to-end
