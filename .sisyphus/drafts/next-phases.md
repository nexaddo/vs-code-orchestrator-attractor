# Draft: Next Phases Roadmap Plan

## What We Know (from roadmap + progress tracker + git history)

### Completed Milestones
- **M0** (0.1-0.6): Repo setup, workspace scaffold, CI skeleton ✅
- **M1**: Shared contracts core, CI hardening, webview shell, extension runtime spine ✅
- **M2**: Backend spine — DOT validator, FileEventLog, GitWorktreeManager, SnapshotProjector, services wiring ✅
- **M3**: First dashboard slice — storage read surface, overview projection, webview overview shell, dashboard bridge + runtime ✅
- **M3.5-M3.9**: Review cleanup, shared UI contract floor, run-scoped persistence, dashboard query+projection, webview hosting+styling ✅ (implied by M4 merge)
- **M4**: Copilot orchestration — PR #28 merged. Chat participant, role prompts, handoff artifacts, orchestration loop, model gateway, bridge commands ✅
- **M5**: Release readiness — PR #29 merged. esbuild bundling, VSIX packaging, startup error boundary, CI packaging validation ✅

### In Progress
- **wire-orchestration** plan: Task 1 (gateway wiring) code done but uncommitted. Tasks 2-7 pending.
- **e2e-regression-tests** plan: 12/89 tasks done (was previous boulder, now paused)

### v1 Feature Requirements (from roadmap)
- Repository-first dashboard
- One executable repository per plan
- Create, run, resume, cancel, and retry plans and milestones
- DOT parsing and validation for v1 Attractor subset
- Graph rendering, timeline, logs, and artifacts
- Internal roles: orchestrator, planner, implementer, reviewer

### Known Gaps (from readiness audit)
1. startOrchestration is placeholder in runtime.ts (wire-orchestration covers this)
2. Model gateway defaults to NoOp (wire-orchestration covers this)
3. Chat commands are placeholders (wire-orchestration covers this)
4. No structured lifecycle logging (wire-orchestration covers this)

## Open Questions (awaiting explore agents)
- Does DOT graph execution exist? (not just validation)
- Does the webview render graphs visually?
- What's the state of timeline/logs/artifacts in the UI?
- Is resume/retry actually implementable with current persistence?
- Is worktree management wired into orchestration?

## Deliverables
1. Updated `docs/plans/progress-tracker.md` reflecting current state
2. New plan in `.sisyphus/plans/v1-next-phases.md` covering remaining v1 work
