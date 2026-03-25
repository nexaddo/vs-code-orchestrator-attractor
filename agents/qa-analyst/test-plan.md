# QA Analyst — Living Test Plan

**Last updated:** 2026-03-18
**Milestones covered:** M1, M2, M3, M3-ext
**Test count:** 233 (32 test files)
**Pass rate:** 100%

---

## Coverage Summary

| Area                           | Files | Tests | Status      |
| ------------------------------ | ----- | ----- | ----------- |
| Shared contracts (M1)          | 6     | 31    | ✅ All pass |
| Extension infrastructure (M2)  | 5     | 34    | ✅ All pass |
| Extension smoke (M1/M2)        | 2     | 7     | ✅ All pass |
| Webview renderers (M3)         | 6     | 88    | ✅ All pass |
| Webview decoders (M3)          | 5     | 22    | ✅ All pass |
| Webview acceptance (M3/M3-ext) | 3     | 23    | ✅ All pass |
| Meta / workflow drift          | 1     | 2     | ✅ All pass |

---

## User Acceptance Criteria

### M1 — Shared Contracts, Event Model, Runtime Spine

**UAC-M1-1: PlanRecord contract validation**

- Given a plan with 2 writable repos → rejected
- Given a plan with 0 writable repos → rejected
- Given a plan with duplicate repo IDs → rejected
- Given a plan with a context-role primary repo → rejected
- Given a plan whose primary ID is absent from repos → rejected
- Given a minimal valid plan → accepted and round-trips through JSON
- ✅ Tested in `packages/shared/test/contracts/plan-record.test.ts`

**UAC-M1-2: RunRecord, GraphRecord, EventEnvelope, WorktreeLease, RepositoryRecord schemas**

- Each schema accepts valid fixtures and rejects invalid ones
- ✅ Tested in `packages/shared/test/contracts/`

**UAC-M1-3: Domain value objects (RunId, GraphId, WorktreeId)**

- Non-empty string → creates ID
- Empty string → throws
- ✅ Tested in `packages/extension/test/smoke/domain.test.ts`

**UAC-M1-4: WebviewOutboundMessage / WebviewInboundMessage contracts**

- Valid message with correct version accepted
- Wrong version rejected
- ✅ Tested in `packages/shared/test/contracts/webview-message.test.ts`

---

### M2 — Storage, Worktree Manager, DOT Parser, Repository Registry

**UAC-M2-1: DOT parser**

- Parses minimal digraph with nodes and edges
- Reads node labels from attributes; falls back to ID
- Handles multi-hop chain, fan-out, isolated nodes
- Rejects invalid DOT syntax
- ✅ Tested in `packages/extension/test/infrastructure/dot/dot-parser.test.ts`

**UAC-M2-2: File-based run, graph, event repositories**

- Persist and load records round-trip correctly
- Event log appends atomically and replays in order
- ✅ Tested in `packages/extension/test/infrastructure/storage/`

**UAC-M2-3: Worktree lease store**

- Allocate, update, and release leases persist correctly
- No orphan leases after release
- ✅ Tested in `packages/extension/test/infrastructure/storage/file-worktree-lease-store.test.ts`

**UAC-M2-4: Repository registry**

- Add, get, and list repository records
- Persist across simulated restarts
- ✅ Tested in `packages/extension/test/infrastructure/registry/file-repository-registry.test.ts`

---

### M3 — Dashboard UI

**UAC-M3-1: Overview panel**

- Renders workspace summary (repo count, plan count, active runs)
- Lists repository names
- Escapes HTML in repo names
- ✅ Tested in `packages/webview/test/overview/renderer.test.ts`

**UAC-M3-2: Repository Inspector**

- Renders name, rootUri, defaultBranch, remoteUrl (optional), labels
- Shows "No plans registered" when empty; lists plans when present
- Escapes HTML in repo name
- ✅ Tested in `packages/webview/test/repository/renderer.test.ts`

**UAC-M3-3: Plan Inspector**

- Renders plan title, goal, status with CSS class
- Shows "No graph compiled yet" when null; shows node count + source when present
- Shows active-run banner when run is active
- Shows "Start New Run" button with correct data-plan-id
- Escapes HTML in plan title
- ✅ Tested in `packages/webview/test/plan/renderer.test.ts`

**UAC-M3-4: Run Inspector — controls**

- Running run: Resume disabled (not paused), Cancel enabled
- Paused run: Resume enabled, Cancel enabled ✅ (acceptance test)
- Queued run: Resume disabled, Cancel enabled ✅ (acceptance test)
- Failed run: Shows Retry button only (terminal) ✅ (acceptance test)
- Canceled run: Shows Retry button only (terminal) ✅ (acceptance test)
- Completed run: Shows Retry button
- ✅ Core in `run/renderer.test.ts`; terminal/paused states in `run/acceptance.test.ts`

**UAC-M3-5: Run Inspector — log tail and step**

- Shows "No log output" when empty; renders lines when present
- Escapes HTML in log lines
- Shows current step ID when set
- ✅ Tested in `packages/webview/test/run/renderer.test.ts`

**UAC-M3-6: Graph view**

- Shows node labels with status CSS classes
- Legend counts match node status distribution
- Defaults to pending for nodes missing from nodeStatuses
- Escapes HTML in node labels
- ✅ Tested in `packages/webview/test/graph/renderer.test.ts`

**UAC-M3-7: Timeline — event feed**

- Shows "No events yet" when empty
- Renders event name, timestamp, aggregate
- Escapes HTML in event names
- ✅ Tested in `packages/webview/test/timeline/renderer.test.ts`

**UAC-M3-8: Message decoders**

- All outbound message decoders (run.state, orchestration.state, repository.state, plan.state, timeline.update, graph.update, overview.state) decode valid messages and reject invalid ones
- ✅ Tested in `packages/webview/test/*/decoder.test.ts`

---

### M3-ext — Orchestration Workflow UI & Multi-Repo Workspace UI

**UAC-M3X-1: OrchestrationPhaseBar — roles and statuses**

- Renders all four role boxes (Orchestrator, Planner, Implementer, Reviewer)
- Shows milestone progress heading (index/count and name)
- Uses status CSS classes (done, running, waiting, failed, skipped)
- Shows active task summary for running role
- ✅ Tested in `packages/webview/test/run/renderer.test.ts`

**UAC-M3X-2: OrchestrationPhaseBar — recovery actions by role**

- Implementer failed: "Retry Implementer" + "Retry From Planner" + "View Artifacts"; no milestone retry ✅ (acceptance test)
- Reviewer failed: "Retry From Planner" + "View Artifacts" only; no implementer/milestone ✅ (acceptance test)
- Orchestrator failed: "Retry Milestone" + "View Artifacts"; no implementer/planner retry ✅ (acceptance test)
- Planner failed: "Retry Milestone" + "View Artifacts"; no implementer/planner retry ✅ (acceptance test)
- All retry buttons carry correct `data-run-id` ✅ (acceptance test)
- ✅ Tested in `packages/webview/test/run/acceptance.test.ts`

**UAC-M3X-3: Timeline — HandoffEventRow**

- Renders with distinct CSS class `timeline-event--handoff`
- Shows ROLE → ROLE transition in uppercase
- Shows reason text; no empty reason rendered when absent ✅ (acceptance test)
- Shows handoff arrow indicator
- ✅ Core in `timeline/renderer.test.ts`; edge cases in `timeline/acceptance.test.ts`

**UAC-M3X-4: AgentActionFeed**

- Shows "No agent actions yet" when no events
- Shows "No agent actions yet" when events exist but none are handoffs ✅ (acceptance test)
- Contains only handoff events (not regular events) in mixed feed ✅ (acceptance test)
- ✅ Tested in `timeline/acceptance.test.ts`

**UAC-M3X-5: RepoBadgeRow**

- Shows `[WRITABLE] name / branch` for read_write repos (styled `repo-badge--writable`)
- Shows `[READ-ONLY] name / branch` for read_only repos (styled `repo-badge--readonly`)
- Renders multiple badges; empty string when no repos
- Escapes HTML in repo name and branch ✅ (acceptance tests in run and plan)
- ✅ Core in `run/renderer.test.ts`; XSS in `run/acceptance.test.ts` and `plan/acceptance.test.ts`

**UAC-M3X-6: PlanRepositoryPicker**

- Single-select radio for executable repo; checked state correct
- Executable repo excluded from context section
- Multi-select checkbox for context repos; checked state correct
- Default mount alias = repo name when not in contextAliases ✅ (acceptance test)
- Custom mount alias shown when provided in contextAliases ✅ (acceptance test)
- "No repositories registered" empty state
- v1 one-writable-repo note displayed
- "+ Register Another Repository" button present
- ✅ Core in `plan/renderer.test.ts`; alias behavior in `plan/acceptance.test.ts`

**UAC-M3X-7: OrchestrationState message decoder**

- Decodes valid happy-path message
- Decodes implementer-failed phase
- Rejects missing runId, wrong phase count, wrong type, non-object
- ✅ Tested in `packages/webview/test/run/orchestration.test.ts`

---

## Deferred / Blocked Tests

### Browser/Playwright Scenarios (requires running extension)

These scenarios require the VS Code extension to be loaded and the webview panel to be active. They cannot run in the current CI setup and should be added once the extension development host is available:

- Extension activation: `attractor.overview` webview panel renders in VS Code
- Command registration: `attractor.registerRepository` command appears in command palette
- Webview message bridge: action buttons post messages to extension host
- Live run updates: timeline panel updates as events stream in

### M4 Scenarios (not yet implemented)

- `@attractor` chat participant responds to `plan` / `run` / `status` intents
- ModelGateway send/stream boundary with mock LLM
- Agent-to-agent handoff envelope validation
- Sequential execution loop: orchestrator → planner → implementer → reviewer cycle

---

## Definition of Done Checklist

A feature is not done until:

- [ ] UAC written and reviewed before implementation
- [ ] Unit tests cover new logic
- [ ] Contract tests cover any new/changed payloads
- [ ] Renderer/decoder tests for any UI changes
- [ ] Acceptance tests for each UAC scenario
- [ ] All tests green in CI (`pnpm ci:fast-checks`)
- [ ] Coverage targets met: shared ≥90%, extension ≥85%, webview ≥80%
