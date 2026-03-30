# v1 Next Phases — Attractor Completion Plan

## TL;DR

> **Quick Summary**: Complete the remaining v1 work for Attractor after M4+M5 ship: finish wiring the live orchestration plumbing (wire-orchestration), close dashboard UX gaps (Run button, control buttons, log viewer, orchestration phase UI), build the React graph surface, implement DOT graph execution, and wire run resume+retry with worktree integration.
>
> **Deliverables**:
> - wire-orchestration committed and merged (T1-T7 + tests)
> - Plan dashboard: Run Plan CTA wired
> - Run inspector: log viewer, phase progress UI, cancel/resume/retry buttons
> - React GraphSurface consuming `graph.update` messages
> - DOT graph executor (node walker for codergen/conditional/wait.human)
> - Run resume + snapshot persistence + worktree integration
> - Progress tracker updated in docs/
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: T0 (progress tracker) → T1 (finish wire-orchestration) → T2/T3/T4 (dashboard actions + log viewer + graph surface) → T5 (graph executor) → T6 (resume+worktree) → F1-F4

---

## Context

### Codebase State (as of 2026-03-29)

`main` is at `42ac2d2` — vitest integration test suite (PR #31).

**What shipped:**
- M0-M5 all merged: contracts, backend spine, dashboard, copilot orchestration, release readiness
- 503+ tests passing
- VSIX packaging working
- `OrchestrationLoop` — 4-phase per milestone (orchestrator → planner → implementer → reviewer)
- `CopilotModelGateway` — fully implemented but never constructed in production (NoOp used instead)
- Chat participant `@attractor` with `/plan` `/run` `/status` — all return placeholder strings
- `startOrchestration` in `runtime.ts` — placeholder, does not instantiate OrchestrationLoop

**What's in progress:**
- `wire-orchestration` plan (`.sisyphus/plans/wire-orchestration.md`) — Task 1 code done in extension.ts, not committed

**What's missing for v1:**
1. Real orchestration plumbing (wire-orchestration T1-T7)
2. Run Plan CTA in PlanSurface
3. Run inspector: log viewer, orchestration phases, control buttons
4. React GraphSurface (decoder+renderer exist in dist, no src component)
5. Event timeline React integration
6. DOT graph executor (node walker — OrchestrationLoop iterates milestones linearly, no graph dispatch)
7. Run resume + retry (bridge stubs; no snapshot persistence)
8. Worktree integration in orchestration (GitWorktreeManager exists but not called during runs)
9. Progress tracker update (docs/plans/progress-tracker.md)

### Feature Completeness Matrix

| Feature | Status |
|---------|--------|
| DOT parsing + validation | ✅ DONE |
| DOT graph execution (node walker) | ❌ MISSING |
| Overview dashboard | ✅ DONE |
| Repository detail surface | ✅ DONE |
| Plan dashboard — Run CTA | ⚠️ PARTIAL |
| Run inspector — phases, logs, controls | ⚠️ PARTIAL |
| Graph rendering (React) | ⚠️ PARTIAL |
| Event timeline (React) | ⚠️ PARTIAL |
| Log viewer in RunSurface | ⚠️ PARTIAL |
| Artifact viewer | ✅ DONE |
| Orchestration roles 4-phase | ✅ DONE |
| Model gateway (real Copilot) | ⚙️ IN PROGRESS |
| Chat commands live | ⚙️ IN PROGRESS |
| startOrchestration live | ⚙️ IN PROGRESS |
| Run cancel | ✅ DONE |
| Run resume | ❌ STUB |
| Run retry | ❌ STUB |
| Worktree integration | ❌ MISSING |

---

## Work Objectives

### Core Objective
Complete the Attractor v1 feature set: live orchestration, full run inspector, graph visualization, and run recovery — so the extension can execute a real plan end-to-end via Copilot.

### Concrete Deliverables
- `packages/extension/src/extension.ts` — gateway wiring committed
- `packages/extension/src/runtime.ts` — real startOrchestration
- `packages/extension/src/chat/attractor-chat-participant.ts` — live /run /plan /status
- `packages/webview/src/plan/PlanSurface.tsx` — Run Plan button
- `packages/webview/src/run/RunSurface.tsx` — log viewer, phases panel, control buttons
- `packages/webview/src/graph/GraphSurface.tsx` — NEW React graph component
- `packages/webview/src/timeline/TimelinePanel.tsx` — NEW event timeline component
- `packages/extension/src/application/graph-executor.ts` — NEW DOT graph node walker
- `packages/extension/src/runtime.ts` — worktree acquire/release during runs
- `docs/plans/progress-tracker.md` — updated to reflect current state

### Definition of Done
- [ ] `pnpm typecheck && pnpm lint && pnpm test --run` passes (503+ tests)
- [ ] F5 → dashboard → "Run Plan" → Output channel shows orchestration lifecycle
- [ ] `@attractor /run <planId>` triggers real OrchestrationLoop execution
- [ ] RunSurface shows real-time milestone progress, log lines, and phase status
- [ ] Graph surface renders nodes from graph.update messages
- [ ] DOT graph executor dispatches codergen/conditional/wait.human nodes correctly

### Must Have
- All 503+ existing tests remain green throughout
- wire-orchestration T1-T7 completed and committed atomically
- Run Plan CTA in PlanSurface calls postMessage.runPlan(planId)
- RunSurface shows OrchestrationStatePayload phases
- GraphSurface renders nodes from graph.update (no external graph lib required — simple node list acceptable for v1)
- DOT graph executor handles: start, exit, codergen, conditional, wait.human nodes
- Worktree acquired before orchestration, released after (success or failure)
- Resume/retry: snapshot-based RunRecord persistence enabling re-entry

### Must NOT Have (Guardrails)
- Do NOT add `vscode.window.showErrorMessage` — codebase deliberately avoids popups
- Do NOT modify `orchestration-loop.ts`, `ports.ts`, `copilot-model-gateway.ts` (FROZEN from wire-orchestration plan)
- Do NOT add new npm packages without explicit justification
- Do NOT implement `parallel`, `fan_in`, `tool`, `manager_loop` node types (deferred to v1.1)
- Do NOT implement simultaneous multi-repo writable execution
- Do NOT add external graph visualization libraries (dagre, d3, graphviz) — simple HTML node list is v1 acceptable
- Do NOT create duplicate `infrastructure/` directory (reject pattern from closed PR #32)
- Do NOT change `RuntimeDependencies` interface shape beyond what wire-orchestration plan established

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (vitest, 503+ tests)
- **Automated tests**: Tests-after strategy for new components
- **Framework**: vitest

### QA Policy
Every task includes agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/`.

- **Extension changes**: `pnpm test --run` + `pnpm typecheck`
- **Webview changes**: `pnpm test --run` + visual verification via Playwright if needed
- **API/Bridge**: unit tests with postMessage capture arrays

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start immediately — wire-orchestration + tracker):
├── T1: Complete wire-orchestration (T1-T7) — finish + commit [unspecified-high]
└── T2: Update progress-tracker.md — purely docs [quick]

Wave 2 (After Wave 1 — dashboard UX + infrastructure, MAX PARALLEL):
├── T3: PlanSurface Run CTA + RunSurface control buttons [visual-engineering]
├── T4: RunSurface log viewer + orchestration phases panel [visual-engineering]
├── T5: React GraphSurface + event timeline panel [visual-engineering]
└── T6: DOT graph executor (graph-executor.ts) [deep]

Wave 3 (After Wave 2 — run recovery + worktree):
├── T7: Snapshot persistence for resume/retry [unspecified-high]
└── T8: Worktree acquire/release in startOrchestration [unspecified-high]

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── F1: Plan Compliance Audit [oracle]
├── F2: Code Quality Review [unspecified-high]
├── F3: Real Manual QA [unspecified-high]
└── F4: Scope Fidelity Check [deep]
→ Present results → Get explicit user okay
```

**Critical Path**: T1 → T3/T4/T5/T6 → T7/T8 → F1-F4
**Parallel Speedup**: ~60% faster than sequential

---

## TODOs

---

- [ ] 1. Complete wire-orchestration plan (T1-T7)

  **What to do**:
  - Verify `packages/extension/src/extension.ts` has `createLanguageModelApi()` and `CopilotModelGateway` wired (Task 1 code was done)
  - Run `pnpm typecheck && pnpm test --run` to confirm 505 tests pass
  - Commit Task 1: `feat(extension): wire CopilotModelGateway at activation`
  - Execute Tasks 2-7 from `.sisyphus/plans/wire-orchestration.md` in order:
    - T2: Refactor `buildChatHandler` to accept `ChatHandlerDependencies` parameter
    - T3: Implement `startOrchestration` — load plan+milestones from storage, map MilestoneRecord→MilestoneInput (title→name+description), save RunRecord status=running, call OrchestrationLoop.execute(), update RunRecord on completion/failure
    - T4: Wire chat `/plan` → list plans from planRegistry
    - T5: Wire chat `/run` → call startOrchestration with parsed planId
    - T6: Wire chat `/status` → query active runs from runRegistry
    - T7: Add structured logging to startOrchestration callbacks (milestone start/end, phase start/end, errors)
  - Mark all wire-orchestration checkboxes done in `.sisyphus/plans/wire-orchestration.md`

  **Must NOT do**:
  - Do NOT modify `orchestration-loop.ts`, `ports.ts`, `copilot-model-gateway.ts`, `bridge.ts`
  - Do NOT add `showErrorMessage` calls
  - Do NOT change `RuntimeDependencies` interface shape beyond minimal needed

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T2)
  - **Parallel Group**: Wave 1 (with T2)
  - **Blocks**: T3, T4, T5, T6, T7, T8
  - **Blocked By**: None (can start immediately)

  **References**:
  - `.sisyphus/plans/wire-orchestration.md` — complete task specs for T1-T7
  - `packages/extension/src/runtime.ts:144-163` — placeholder to replace in T3
  - `packages/extension/src/chat/attractor-chat-participant.ts` — placeholder handlers to replace in T4-T6
  - `packages/extension/src/extension.ts` — gateway adapter already added
  - `packages/extension/src/application/orchestration-loop.ts` — OrchestrationOptions interface (what to construct)
  - `packages/extension/src/application/ports.ts` — ModelGateway interface
  - `packages/extension/src/storage/services.ts` — StorageServices shape (planRegistry, milestoneRegistry, runRegistry)

  **Acceptance Criteria**:
  - [ ] `pnpm typecheck && pnpm lint && pnpm test --run` passes
  - [ ] 5 atomic commits produced (one per sub-task grouping)
  - [ ] All wire-orchestration checkboxes marked done

  **QA Scenarios**:
  ```
  Scenario: Chat /plan returns stored plans
    Tool: Bash (pnpm test --run --reporter=verbose)
    Steps:
      1. Run test suite
      2. Assert /plan command tests pass
    Expected: All 505+ tests green, /plan test asserts planRegistry.list() is called
    Evidence: .sisyphus/evidence/task-1-tests-pass.txt

  Scenario: startOrchestration calls OrchestrationLoop.execute()
    Tool: Bash (pnpm test --run packages/extension/test)
    Steps:
      1. Run extension tests
      2. Assert activation test confirms OrchestrationLoop.execute() called with correct shape
    Expected: No test failures; mock OrchestrationLoop.execute spy was invoked
    Evidence: .sisyphus/evidence/task-1-orchestration-wired.txt
  ```

  **Commit**: YES — 5 atomic commits
  - `feat(extension): wire CopilotModelGateway at activation`
  - `refactor(chat): accept ChatHandlerDependencies in buildChatHandler`
  - `feat(runtime): implement startOrchestration with OrchestrationLoop`
  - `feat(chat): wire /plan, /run, /status commands to real services`
  - `feat(runtime): add structured orchestration lifecycle logging`

---

- [ ] 2. Update progress tracker in docs/

  **What to do**:
  - Overwrite `docs/plans/progress-tracker.md` with the current state:
    - Mark M0-M5 all complete with PR numbers and commit SHAs
    - Add "M5 Polish + Regression Tests" section (PRs #30, #31)
    - Add "In Progress" section: wire-orchestration status
    - Add "Feature Completeness Matrix" table (see Context section above)
    - Update "Next Up" to reference `.sisyphus/plans/v1-next-phases.md`
    - Update "Session Resume Note" to reflect `main` at `42ac2d2`
  - Commit: `docs: update progress tracker to current state post-M5`

  **Must NOT do**:
  - Do NOT delete historical milestone records
  - Do NOT alter the format/structure significantly

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T1)
  - **Parallel Group**: Wave 1
  - **Blocks**: Nothing critical
  - **Blocked By**: None

  **References**:
  - `docs/plans/progress-tracker.md` — current file to update
  - `docs/plans/roadmap.md` — milestone definitions
  - Git log for PR numbers and SHAs (run `git log --oneline -30`)
  - Feature completeness matrix: see Context section of this plan

  **Acceptance Criteria**:
  - [ ] `docs/plans/progress-tracker.md` committed with current state
  - [ ] All M0-M5 milestones listed as complete
  - [ ] Feature completeness matrix present
  - [ ] Next Up section points to `.sisyphus/plans/v1-next-phases.md`

  **QA Scenarios**:
  ```
  Scenario: Progress tracker is readable and accurate
    Tool: Bash (git log --oneline docs/plans/progress-tracker.md)
    Steps:
      1. Confirm new commit on progress-tracker.md
      2. Read the file and verify all sections are present
    Expected: File has M0-M5 complete, feature matrix, In Progress section
    Evidence: .sisyphus/evidence/task-2-progress-tracker.txt
  ```

  **Commit**: YES
  - Message: `docs: update progress tracker to current state post-M5`
  - Files: `docs/plans/progress-tracker.md`

---

- [ ] 3. PlanSurface Run CTA + RunSurface control buttons

  **What to do**:
  - **PlanSurface** (`packages/webview/src/plan/PlanSurface.tsx`):
    - Add a "Run Plan" button in the plan header card (near title/goal area)
    - On click: call `postMessage.runPlan(viewModel.planId)` (helper already exists in `src/app/postMessage.ts`)
    - Add `data-testid="plan-run-btn"` to the button
    - Disable the button if plan status is not "ready" or milestones empty
    - Show button as "Cancel" (calls `postMessage.cancelRun(activeRunId)`) when run is active
  - **RunSurface** (`packages/webview/src/run/RunSurface.tsx`):
    - Add control buttons panel below run header:
      - "Cancel" button → `postMessage.cancelRun(runId)` — shown when status="running"
      - "Retry" button → `postMessage.retryRun(runId)` — shown when status="failed"
      - "Resume" button → `postMessage.resumeRun(runId)` — shown when status="paused"
    - Add `data-testid="run-cancel-btn"`, `data-testid="run-retry-btn"`, `data-testid="run-resume-btn"`
    - All three postMessage helpers already exist in `src/app/postMessage.ts`

  **Must NOT do**:
  - Do NOT add new npm packages
  - Do NOT change the bridge.ts or extension-side code (buttons just call existing postMessage helpers)
  - Do NOT implement run.resume or run.retry server-side logic here (that is T7/T8)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T4, T5, T6)
  - **Parallel Group**: Wave 2
  - **Blocks**: Nothing (UI only)
  - **Blocked By**: T1 (wire-orchestration must be done first so postMessage types are confirmed)

  **References**:
  - `packages/webview/src/plan/PlanSurface.tsx` — current plan surface to modify
  - `packages/webview/src/run/RunSurface.tsx` — current run surface to modify
  - `packages/webview/src/app/postMessage.ts` — postMessage helpers (runPlan, cancelRun, retryRun, resumeRun)
  - `packages/webview/src/overview/OverviewSurface.tsx` — follow same button/card patterns
  - `packages/webview/test/plan/plan-surface.test.ts` — existing tests to update
  - `packages/webview/test/run/run-surface.test.ts` — existing tests to update

  **Acceptance Criteria**:
  - [ ] PlanSurface renders "Run Plan" button with `data-testid="plan-run-btn"`
  - [ ] Clicking Run Plan calls `postMessage.runPlan` (captured in test)
  - [ ] RunSurface renders cancel/retry/resume buttons with correct data-testid
  - [ ] Buttons are conditionally visible based on run status
  - [ ] `pnpm typecheck && pnpm test --run` passes

  **QA Scenarios**:
  ```
  Scenario: Run Plan button dispatches runPlan postMessage
    Tool: Bash (pnpm test --run packages/webview)
    Steps:
      1. Render PlanSurface with plan.status="ready" and milestones=[{id:"m1",...}]
      2. Click [data-testid="plan-run-btn"]
      3. Assert postMessage called with type="plan.run" payload.planId
    Expected: postMessage spy called with correct plan.run shape
    Evidence: .sisyphus/evidence/task-3-run-btn.txt

  Scenario: RunSurface cancel button visible only when running
    Tool: Bash (pnpm test --run packages/webview)
    Steps:
      1. Render RunSurface with status="running"
      2. Assert [data-testid="run-cancel-btn"] is visible
      3. Render with status="completed" — assert cancel btn absent
    Expected: Cancel button conditional on run status
    Evidence: .sisyphus/evidence/task-3-control-btns.txt
  ```

  **Commit**: YES
  - Message: `feat(webview): add Run Plan CTA to PlanSurface and control buttons to RunSurface`

---

- [ ] 4. RunSurface log viewer + orchestration phases panel

  **What to do**:
  - **Orchestration phases panel** in RunSurface:
    - The app store already has `store.orchestration` updated by `orchestration.state` messages
    - Read `OrchestrationStatePayload` from `packages/shared/src/contracts/index.ts`
    - Shape: `{ runId, milestoneIndex, milestoneCount, milestoneName, phases: AgentRolePhaseSchema[4] }`
    - Each phase: `{ role, status, taskSummary?, errorLabel? }`
    - Add a "Phases" card in RunSurface that renders the 4 role phases (orchestrator/planner/implementer/reviewer) with status badges
    - Use existing `StatusBadge` component for phase statuses
    - Add `data-testid="run-phases"` to the container
  - **Log viewer panel** in RunSurface:
    - Decide on inbound message: use `run.state` payload extension OR a new `run.log` message type
    - Recommended: extend `RunState` (in shared contracts) to include optional `logLines: string[]`
    - Use existing `LogLine` component (`packages/webview/src/components/LogLine.tsx`)
    - Add a "Logs" card in RunSurface that renders log lines
    - Add `data-testid="run-logs"` to the container
    - Show most recent 100 lines (cap with scroll)

  **Must NOT do**:
  - Do NOT add a WebSocket or streaming connection — messages come via existing bridge postMessage
  - Do NOT modify `orchestration-loop.ts`
  - Do NOT add external log parsing libraries

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T3, T5, T6)
  - **Parallel Group**: Wave 2
  - **Blocks**: Nothing
  - **Blocked By**: T1

  **References**:
  - `packages/webview/src/run/RunSurface.tsx` — surface to modify
  - `packages/webview/src/components/LogLine.tsx` — LogLine component to use
  - `packages/webview/src/components/StatusBadge.tsx` — StatusBadge for phase statuses
  - `packages/webview/src/app/store.ts` — store.orchestration shape
  - `packages/webview/src/app/message-dispatch.ts` — orchestration.state dispatch
  - `packages/shared/src/contracts/index.ts` — OrchestrationStatePayloadSchema, AgentRolePhaseSchema
  - `packages/webview/dist/src/run/renderer.js` — compiled renderer reference for log-tail pattern

  **Acceptance Criteria**:
  - [ ] RunSurface shows 4-phase panel when orchestration.state message received
  - [ ] Phase statuses render with StatusBadge colors
  - [ ] Log panel renders log lines from RunState.logLines (or run.log messages)
  - [ ] `data-testid="run-phases"` and `data-testid="run-logs"` present
  - [ ] `pnpm typecheck && pnpm test --run` passes

  **QA Scenarios**:
  ```
  Scenario: Orchestration phases panel renders from orchestration.state message
    Tool: Bash (pnpm test --run packages/webview)
    Steps:
      1. Dispatch orchestration.state with phases=[{role:"orchestrator",status:"done"},{role:"planner",status:"running"},...]
      2. Assert [data-testid="run-phases"] contains 4 phase rows
      3. Assert "orchestrator" phase has "done" badge, "planner" has "running" badge
    Expected: All 4 phases rendered with correct statuses
    Evidence: .sisyphus/evidence/task-4-phases.txt

  Scenario: Log viewer renders log lines
    Tool: Bash (pnpm test --run packages/webview)
    Steps:
      1. Render RunSurface with state.logLines=["line 1","line 2","line 3"]
      2. Assert [data-testid="run-logs"] contains 3 LogLine elements
    Expected: Log lines rendered in order
    Evidence: .sisyphus/evidence/task-4-logs.txt
  ```

  **Commit**: YES
  - Message: `feat(webview): add orchestration phases panel and log viewer to RunSurface`

---

- [ ] 5. React GraphSurface + event timeline panel

  **What to do**:
  - **GraphSurface** (`packages/webview/src/graph/GraphSurface.tsx` — NEW):
    - Create `src/graph/` directory with `GraphSurface.tsx` and `index.ts`
    - The store already handles `graph.update` messages → `store.graphUpdate`
    - Read `graph.update` payload shape from shared contracts (`GraphUpdatePayload` or inspect `dist/src/graph/decoder.js` for shape)
    - Render a node list: for each node, show nodeId, nodeType badge, status badge, and edges as text
    - Add `data-testid="graph-surface"` and `data-testid="graph-node-{id}"` per node
    - Wire node click → `postMessage.focusGraphNode(nodeId)` (helper already exists)
    - Register GraphSurface in the app (conditionally shown in the webview panel — show when graph.update received)
  - **TimelinePanel** (`packages/webview/src/timeline/TimelinePanel.tsx` — NEW):
    - Create `src/timeline/` directory with `TimelinePanel.tsx` and `index.ts`
    - Render event feed from `timeline.update` messages (if payload arrives) or from RunState.milestoneRuns events
    - Each event: timestamp, event type, description
    - Add `data-testid="timeline-panel"`, `data-testid="timeline-event-{index}"`
    - Integrate into RunSurface as a "Timeline" tab or expandable panel

  **Must NOT do**:
  - Do NOT add dagre, d3, graphviz, or mermaid libraries
  - Do NOT render Canvas/SVG graph layouts for v1 — HTML node list is acceptable
  - Do NOT implement edge routing or graph layout algorithms

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T3, T4, T6)
  - **Parallel Group**: Wave 2
  - **Blocks**: Nothing
  - **Blocked By**: T1

  **References**:
  - `packages/webview/src/app/store.ts` — store.graphUpdate shape
  - `packages/webview/src/app/message-dispatch.ts` — graph.update dispatch
  - `packages/webview/src/app/postMessage.ts` — focusGraphNode helper
  - `packages/webview/dist/src/graph/decoder.js` — decoded payload shape reference
  - `packages/webview/dist/src/graph/renderer.js` — compiled renderer reference (HTML node-list pattern)
  - `packages/webview/dist/src/timeline/decoder.js` — timeline decoded payload shape
  - `packages/webview/dist/src/timeline/renderer.js` — event feed rendering reference
  - `packages/webview/src/run/RunSurface.tsx` — where to integrate TimelinePanel
  - `packages/shared/src/contracts/index.ts` — NodeStatusSchema, graph-related schemas

  **Acceptance Criteria**:
  - [ ] `packages/webview/src/graph/GraphSurface.tsx` exists and renders node list
  - [ ] Node click dispatches `postMessage.focusGraphNode(nodeId)`
  - [ ] `packages/webview/src/timeline/TimelinePanel.tsx` exists and renders event feed
  - [ ] Both components have appropriate data-testid attributes
  - [ ] `pnpm typecheck && pnpm test --run` passes

  **QA Scenarios**:
  ```
  Scenario: GraphSurface renders nodes from graph.update payload
    Tool: Bash (pnpm test --run packages/webview)
    Steps:
      1. Dispatch graph.update with nodes=[{id:"n1",type:"codergen",status:"running"},{id:"n2",type:"exit",status:"queued"}]
      2. Assert [data-testid="graph-surface"] present
      3. Assert [data-testid="graph-node-n1"] has "codergen" and "running" text
    Expected: Both nodes rendered with correct type and status
    Evidence: .sisyphus/evidence/task-5-graph.txt

  Scenario: Node click sends focusGraphNode postMessage
    Tool: Bash (pnpm test --run packages/webview)
    Steps:
      1. Render GraphSurface with node "n1"
      2. Click [data-testid="graph-node-n1"]
      3. Assert postMessage spy called with type="graph.focus" payload.nodeId="n1"
    Expected: postMessage called with correct payload
    Evidence: .sisyphus/evidence/task-5-graph-click.txt
  ```

  **Commit**: YES
  - Message: `feat(webview): add React GraphSurface and TimelinePanel components`

---

- [ ] 6. DOT graph executor

  **What to do**:
  - Create `packages/extension/src/application/graph-executor.ts` — a graph node walker
  - The executor traverses a DOT graph and dispatches work for each node type:
    - `start` — begin traversal, emit run-started event
    - `codergen` — call OrchestrationLoop.execute() for this node's milestones
    - `conditional` — evaluate the condition (from node attributes) and pick next node
    - `wait.human` — pause and emit a `run.state` pause notification; wait for bridge resume signal
    - `exit` — emit run-completed event, stop traversal
  - The executor should accept: `{ graph: ParsedGraph, runId, planId, services, modelGateway, signal, onStateChange }`
  - The executor should emit events to the event log and post state updates via callback
  - Write unit tests in `packages/extension/test/application/graph-executor.test.ts`

  **Key constraint**: For v1, OrchestrationLoop already handles milestones linearly. The graph executor is the higher-level wrapper that determines WHICH milestones to pass and in what order, based on DOT graph traversal.

  **Must NOT do**:
  - Do NOT implement `parallel`, `fan_in`, `tool`, `manager_loop` node types
  - Do NOT modify `OrchestrationLoop` internals
  - Do NOT make the executor depend on VS Code extension host APIs directly (keep it pure)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T3, T4, T5)
  - **Parallel Group**: Wave 2
  - **Blocks**: T8 (worktree wiring needs the executor interface)
  - **Blocked By**: T1

  **References**:
  - `packages/extension/src/application/orchestration-loop.ts` — OrchestrationLoop.execute() interface
  - `packages/extension/src/application/ports.ts` — ModelGateway interface
  - `packages/extension/src/storage/services.ts` — StorageServices interface
  - `packages/extension/src/dot/validator.ts` (or wherever validateDot lives) — DOT graph parse output shape
  - `packages/shared/src/contracts/index.ts` — NodeStatusSchema ("queued"|"running"|"blocked"|"failed"|"succeeded"|"canceled")
  - `packages/extension/test/application/orchestration-loop.test.ts` — test patterns to follow (StubModelGateway, callbacks)
  - `docs/plans/roadmap.md` — v1 node types (start, exit, codergen, conditional, wait.human)

  **Acceptance Criteria**:
  - [ ] `graph-executor.ts` exported from application module
  - [ ] Unit tests cover: start→codergen→exit traversal, conditional branching, wait.human pause
  - [ ] Executor calls OrchestrationLoop.execute() for codergen nodes
  - [ ] Executor emits correct node statuses (queued/running/succeeded/failed)
  - [ ] Abort signal propagated correctly
  - [ ] `pnpm typecheck && pnpm test --run` passes

  **QA Scenarios**:
  ```
  Scenario: Graph executor traverses start→codergen→exit and calls OrchestrationLoop
    Tool: Bash (pnpm test --run packages/extension/test/application/graph-executor.test.ts)
    Steps:
      1. Create minimal DOT graph: start → codergen("m1") → exit
      2. Run executor with StubModelGateway
      3. Assert OrchestrationLoop.execute() called with milestones for "m1"
      4. Assert run-completed event emitted
    Expected: execute() called once, completion event emitted
    Evidence: .sisyphus/evidence/task-6-graph-executor.txt

  Scenario: Conditional node picks correct branch
    Tool: Bash (pnpm test --run packages/extension/test/application/graph-executor.test.ts)
    Steps:
      1. Graph: start → codergen("m1") → conditional(cond="approved") → [exit OR codergen("m2")]
      2. Run with condition evaluating to "approved"
      3. Assert execution takes exit branch, m2 NOT executed
    Expected: Only m1 executed, exit reached
    Evidence: .sisyphus/evidence/task-6-conditional.txt
  ```

  **Commit**: YES
  - Message: `feat(extension): add DOT graph executor for node-based plan traversal`

---

- [ ] 7. Snapshot persistence for run resume/retry

  **What to do**:
  - Implement snapshot-based RunRecord persistence to enable resume and retry
  - Create `packages/extension/src/application/run-snapshot.ts`:
    - `saveRunSnapshot(runId, milestoneIndex, handoffs, services)` — persists current execution progress
    - `loadRunSnapshot(runId, services)` — retrieves last checkpoint
    - `clearRunSnapshot(runId, services)` — clears on completion
  - Update `startOrchestration` in `runtime.ts`:
    - On `run.resume`: load snapshot, reconstruct OrchestrationOptions, pass `startFromMilestoneIndex` to re-entry
    - On `run.retry`: clear snapshot, restart from beginning
  - Unwire `run.resume` and `run.retry` stubs in `bridge.ts` — change from "not yet supported" to calling `orchestration.startOrchestration` with mode parameter
  - Write integration tests in `packages/extension/test/application/run-snapshot.test.ts`

  **Must NOT do**:
  - Do NOT add a database dependency — use file-backed storage (follow existing storage patterns in `storage/services.ts`)
  - Do NOT implement multi-run concurrent snapshots for v1

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T8)
  - **Parallel Group**: Wave 3
  - **Blocks**: F1-F4
  - **Blocked By**: T1

  **References**:
  - `packages/extension/src/storage/services.ts` — StorageServices, file-backed registry patterns
  - `packages/extension/src/runtime.ts` — startOrchestration to update
  - `packages/extension/src/dashboard/bridge.ts` — run.resume/run.retry stubs to unwire
  - `packages/extension/src/application/orchestration-loop.ts` — OrchestrationOptions (for re-entry point)
  - `packages/extension/test/integration/bridge-commands.test.ts` — integration test patterns
  - `packages/shared/src/contracts/index.ts` — RunRecordSchema (completedAt, startedAt fields)

  **Acceptance Criteria**:
  - [ ] `run-snapshot.ts` exists with save/load/clear functions
  - [ ] `run.resume` in bridge calls `startOrchestration` with snapshot-loaded state
  - [ ] `run.retry` in bridge calls `startOrchestration` from fresh start
  - [ ] Integration tests cover save+load round-trip and mid-run resume
  - [ ] `pnpm typecheck && pnpm test --run` passes

  **QA Scenarios**:
  ```
  Scenario: Snapshot saves and reloads correctly
    Tool: Bash (pnpm test --run packages/extension/test/application/run-snapshot.test.ts)
    Steps:
      1. Save snapshot for run="r1" at milestoneIndex=2 with handoffs
      2. Load snapshot for run="r1"
      3. Assert milestoneIndex=2 and handoffs match saved data
    Expected: Round-trip fidelity — loaded snapshot matches saved
    Evidence: .sisyphus/evidence/task-7-snapshot-roundtrip.txt

  Scenario: bridge run.resume triggers startOrchestration with snapshot
    Tool: Bash (pnpm test --run packages/extension/test/integration/bridge-commands.test.ts)
    Steps:
      1. Set up saved snapshot for run "r1"
      2. Send run.resume bridge message for runId="r1"
      3. Assert startOrchestration called with milestoneStartIndex=2
    Expected: Orchestration resumes from correct milestone
    Evidence: .sisyphus/evidence/task-7-resume.txt
  ```

  **Commit**: YES
  - Message: `feat(extension): implement run snapshot persistence for resume and retry`

---

- [ ] 8. Worktree acquire/release in orchestration

  **What to do**:
  - Wire `GitWorktreeManager` into `startOrchestration` in `runtime.ts`:
    - Before calling OrchestrationLoop.execute(): `await worktreeManager.acquire(runId, planId)`
    - Pass the acquired worktree path into OrchestrationOptions (if OrchestrationLoop needs it — check interface)
    - After completion (success or failure in finally block): `await worktreeManager.release(runId)`
  - The `GitWorktreeManager` was shipped in M2 (`packages/extension/src/worktrees/`) and has its own tests
  - Wire the manager through `RuntimeDependencies` (same injection pattern as `modelGateway`)
  - Add worktree status to OutputChannel logging: "worktree acquired: {path}", "worktree released: {runId}"
  - Write activation-level tests confirming worktree acquire/release lifecycle

  **Must NOT do**:
  - Do NOT change the `GitWorktreeManager` internals (FROZEN — has 100+ passing tests)
  - Do NOT acquire worktrees for read-only context repositories (v1: one writable repo per plan)
  - Do NOT fail the run if worktree release fails — log error, continue

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T7)
  - **Parallel Group**: Wave 3
  - **Blocks**: F1-F4
  - **Blocked By**: T1, T6 (graph executor interface may inform worktree scoping)

  **References**:
  - `packages/extension/src/worktrees/` — GitWorktreeManager implementation
  - `packages/extension/src/runtime.ts` — startOrchestration to update
  - `packages/extension/src/application/ports.ts` — RuntimeDependencies to extend if needed
  - `packages/extension/test/smoke/activation.test.ts` — activation test patterns
  - `packages/extension/test/` — worktree test patterns to follow

  **Acceptance Criteria**:
  - [ ] `worktreeManager.acquire()` called before OrchestrationLoop.execute()
  - [ ] `worktreeManager.release()` called in finally block
  - [ ] OutputChannel logs: "worktree acquired" and "worktree released"
  - [ ] Test confirms acquire+release lifecycle on mock worktree manager
  - [ ] `pnpm typecheck && pnpm test --run` passes

  **QA Scenarios**:
  ```
  Scenario: Worktree acquired before orchestration and released after
    Tool: Bash (pnpm test --run packages/extension/test/smoke)
    Steps:
      1. Activate with mock worktreeManager (spy on acquire/release)
      2. Trigger startOrchestration for runId="r1" planId="p1"
      3. Assert worktreeManager.acquire("r1","p1") called before execute()
      4. Assert worktreeManager.release("r1") called after execute() resolves
    Expected: acquire called first, release called in finally
    Evidence: .sisyphus/evidence/task-8-worktree.txt

  Scenario: Worktree release called even when orchestration fails
    Tool: Bash (pnpm test --run packages/extension/test/smoke)
    Steps:
      1. Mock OrchestrationLoop.execute() to throw
      2. Assert worktreeManager.release() still called
    Expected: Release called regardless of orchestration success/failure
    Evidence: .sisyphus/evidence/task-8-worktree-release-on-error.txt
  ```

  **Commit**: YES
  - Message: `feat(extension): wire GitWorktreeManager acquire/release into startOrchestration`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns. Check evidence files exist. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `pnpm typecheck && pnpm lint && pnpm test --run`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check for AI slop: excessive comments, over-abstraction, generic names.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high`
  Start from clean state. Execute EVERY QA scenario from EVERY task. Test integration: Run Plan button → bridge → startOrchestration → OrchestrationLoop (with mock model). Test graph executor end-to-end with minimal DOT graph. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance. Flag `infrastructure/` duplication if any appears.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | VERDICT`

---

## Commit Strategy

| Commit | Message | Files |
|--------|---------|-------|
| 1 | `feat(extension): wire CopilotModelGateway at activation` | `src/extension.ts`, `test/smoke/gateway-wiring.test.ts` |
| 2 | `refactor(chat): accept ChatHandlerDependencies in buildChatHandler` | `src/chat/attractor-chat-participant.ts`, tests |
| 3 | `feat(runtime): implement startOrchestration with OrchestrationLoop` | `src/runtime.ts`, tests |
| 4 | `feat(chat): wire /plan, /run, /status commands to real services` | `src/chat/attractor-chat-participant.ts`, tests |
| 5 | `feat(runtime): add structured orchestration lifecycle logging` | `src/runtime.ts`, tests |
| 6 | `docs: update progress tracker to current state post-M5` | `docs/plans/progress-tracker.md` |
| 7 | `feat(webview): add Run Plan CTA to PlanSurface and control buttons to RunSurface` | webview sources + tests |
| 8 | `feat(webview): add orchestration phases panel and log viewer to RunSurface` | webview sources + tests |
| 9 | `feat(webview): add React GraphSurface and TimelinePanel components` | webview sources + tests |
| 10 | `feat(extension): add DOT graph executor for node-based plan traversal` | `src/application/graph-executor.ts`, tests |
| 11 | `feat(extension): implement run snapshot persistence for resume and retry` | `src/application/run-snapshot.ts`, `src/dashboard/bridge.ts`, tests |
| 12 | `feat(extension): wire GitWorktreeManager acquire/release into startOrchestration` | `src/runtime.ts`, tests |

---

## Success Criteria

### Verification Commands
```bash
pnpm typecheck     # Expected: exit 0, zero errors
pnpm lint          # Expected: exit 0, zero violations
pnpm test --run    # Expected: all 503+ tests pass
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent (frozen files untouched, no `infrastructure/` duplicate)
- [ ] All 503+ tests pass
- [ ] `startOrchestration` invokes OrchestrationLoop with real model gateway
- [ ] Chat `/run`, `/plan`, `/status` return real data
- [ ] "Run Plan" button visible in PlanSurface
- [ ] RunSurface shows phases, logs, and control buttons
- [ ] GraphSurface renders nodes from graph.update
- [ ] DOT graph executor traverses start→codergen→exit correctly
- [ ] Worktree acquired before run and released after
- [ ] `docs/plans/progress-tracker.md` updated
