# M4 — Copilot Orchestration Implementation Plan

## Status: DRAFT — Awaiting Momus Review

## Overview

Decompose M4 (Copilot Orchestration) from the Attractor roadmap into 10 dependency-ordered implementation slices. Each slice is independently committable, pairs tests with implementation, and targets max ~300 lines of new code.

## Architecture Decisions (Locked)

1. **RunRecord shape**: Add `graphId`, `worktreeId`, `startedAt`, `completedAt` as OPTIONAL fields. Keep `attempt`.
2. **ModelGateway location**: Create `application/ports.ts` for ModelGateway ONLY. Don't move storage ports from `storage/services.ts`.
3. **WebviewBridge**: Extend existing `bridge.ts` + `WebviewPostTarget` pattern. Don't create a separate WebviewBridge class.
4. **Chat API injection**: Add `ChatApiLike` parameter to `activateAttractor` and pass from `extension.ts`.
5. **@types/vscode upgrade**: Replace `vscode: ^1.1.37` with `@types/vscode: ^1.103.0`. Remove `require("vscode")` workaround.

## Constraints

- v1 scope: one writable repo per plan
- Node types: start, exit, codergen, conditional, wait.human only
- Deferred: parallel, fan_in, tool, manager_loop
- Quality gates: `pnpm typecheck && pnpm lint && pnpm test` must pass
- CI also runs `pnpm format:check`
- Atomic commits per slice, tests paired with implementation
- Must not break existing 319 tests (37 test files)
- No live Copilot calls in tests; all model behavior must be stubbed

## Existing Codebase Snapshot (main branch)

### Package Structure

- `packages/shared/` — Zod schemas, contracts (400 lines in `contracts/index.ts`)
- `packages/extension/` — VS Code extension (32 source files across runtime, dashboard, storage, worktrees, graph)
- `packages/webview/` — Preact+Tailwind webview (33 source files across surfaces, store, components)

### Key Extension Seams

- `runtime.ts` — `activateAttractor(context, commandsApi, dependencies)` with `StorageServices`, `WebviewViewProvider` registration, `onWebviewMessage` handler
- `dashboard/bridge.ts` — `handleWebviewMessage()` dispatches query routes (ready, repository.open, milestone.open, graph.focus) and command no-ops (plan.create, plan.run, run.resume, run.cancel, run.retry)
- `extension.ts` — passes `commands` and `WindowApiLike` to `activateAttractor`. Uses `require("vscode")` workaround due to old vscode types package
- `storage/services.ts` — `StorageServices` interface with 8 registries/projectors
- `dashboard/webview-provider.ts` — `AttractorViewProvider` with `WebviewPostTarget` pattern

### Shared Contracts Already Present

- `RoleSchema` = enum ["orchestrator", "planner", "implementer", "reviewer"] — ALREADY EXISTS
- `RunRecordSchema` with `attempt` field (no `graphId`/`worktreeId`/`startedAt`/`completedAt`)
- `WebviewOutboundMessageTypeSchema` = enum ["overview.state", "repository.state", "plan.state", "run.state", "timeline.update", "graph.update", "toast"]
- `HandoffEnvelopeSchema`, `ArtifactRecordSchema`, `MilestoneRunRecordSchema`, all M3.6+ schemas
- `NodeStatusSchema` = enum ["queued", "running", "blocked", "failed", "succeeded", "canceled"]

### Test Infrastructure

- 37 test files, ~319 tests
- Vitest runner, fixture-based contract tests
- Fixtures under `test/fixtures/contracts/**`
- Bridge tests use `makeServices()` factory with typed mocks
- Activation tests verify command registration, storage wiring, webview provider registration

---

## Slice 1 — Shared Contract Floor for Orchestration

**Goal:** Add minimum cross-package schemas before any runtime work.

**Inputs:** Current `RoleSchema`, `RunRecord`, outbound message contracts.

**Outputs:**

- `AgentRoleStatusSchema` = enum ["done", "running", "waiting", "failed", "skipped"]
- `AgentRolePhaseSchema` = object { role: RoleSchema, status: AgentRoleStatusSchema, taskSummary?: string, errorLabel?: string }
- `OrchestrationStatePayloadSchema` = object { runId, milestoneIndex, milestoneCount, milestoneName, phases: AgentRolePhaseSchema[4] }
- Role-specific handoff payload schemas:
  - `OrchestratorHandoffSchema` = { version, milestoneId, milestoneName, description, acceptanceCriteria[] }
  - `PlannerHandoffSchema` = { version, milestoneId, tasks[{id, description, testFirst}], filesLikelyAffected[] }
  - `ImplementerHandoffSchema` = { version, milestoneId, tasksCompleted[], summary, testsPassed }
  - `ReviewerHandoffSchema` = { version, milestoneId, approved, comments[], requiresChanges }
- `WebviewOutboundMessageTypeSchema` += "orchestration.state"
- `RunRecordSchema` += optional `graphId`, `worktreeId`, `startedAt`, `completedAt`

**Tests:**

- Schema parse/reject tests for all new orchestration payloads (valid + invalid)
- Updated run record tests accept new optional fields
- Updated webview message tests accept "orchestration.state"
- Round-trip tests for new schemas
- Fixture files if pattern requires

**Files Modified:**

- `packages/shared/src/contracts/index.ts`
- `packages/shared/test/contracts/run-record.test.ts`
- `packages/shared/test/contracts/webview-message.test.ts`
- NEW: `packages/shared/test/contracts/m4-schemas.test.ts`
- NEW: `test/fixtures/contracts/runs/valid/with-optional-m4-fields.json` (if fixture pattern used)

**Acceptance:**

- All new payloads parse correctly with valid data
- All new payloads reject invalid data
- Existing payloads still parse unchanged
- `pnpm typecheck && pnpm lint && pnpm test` passes
- Zero consumer breakage in extension or webview packages

**Estimated Size:** ~120 lines schema + ~100 lines tests

---

## Slice 2 — VS Code Typing + Contribution Floor

**Goal:** Unblock chat participant and `vscode.lm` types without changing runtime behavior.

**Inputs:** Slice 1 complete.

**Outputs:**

- Replace `"vscode": "^1.1.37"` devDep with `"@types/vscode": "^1.103.0"` in extension package.json
- Remove `require("vscode")` workaround from `extension.ts`; use proper static imports
- Add `chatParticipants` contribution to extension `package.json`
- Add `onChatParticipant:attractor.attractor` activation event
- Add commands: `attractor.run.start`, `attractor.run.cancel`, `attractor.plan.create`

**Tests:**

- Activation smoke tests still pass
- TypeScript compiles cleanly with new types (typecheck is the test)

**Files Modified:**

- `packages/extension/package.json`
- `packages/extension/src/extension.ts`
- `packages/extension/test/smoke/activation.test.ts` (if assertions need updating)

**Acceptance:**

- `pnpm typecheck` succeeds with `@types/vscode` and chat/lm APIs available
- `pnpm test` passes — no regressions
- Dashboard activation still works
- New commands/contributions present in manifest

**Estimated Size:** ~50 lines changes + manifest updates

---

## Slice 3 — Model Port Seam

**Goal:** Isolate model access behind a testable interface before any Copilot wiring.

**Inputs:** Slice 1 complete.

**Outputs:**

- `ModelGateway` interface: `send(messages, options) => Promise<string>`, `stream(messages, onChunk, options) => Promise<void>`
- `ModelMessage` type: `{ role: "system" | "user" | "assistant", content: string }`
- `ModelRequestOptions` type: `{ modelFamily?: string, maxTokens?: number, temperature?: number, signal?: AbortSignal }`
- `NoOpModelGateway` class implementing `ModelGateway` (returns empty string / no chunks)
- Barrel export

**Tests:**

- `NoOpModelGateway.send()` returns empty string
- `NoOpModelGateway.stream()` completes without calling onChunk
- Type-level coverage for `ModelMessage` and `ModelRequestOptions`

**Files Created:**

- `packages/extension/src/application/ports.ts`
- `packages/extension/src/application/index.ts`
- `packages/extension/test/application/ports.test.ts`

**Acceptance:**

- Clean interface that downstream slices can depend on
- No VS Code imports in this file
- `pnpm typecheck && pnpm test` passes

**Estimated Size:** ~60 lines source + ~40 lines tests

---

## Slice 4 — Role Prompt Builders

**Goal:** Ship pure prompt assembly as a fully testable slice.

**Inputs:** Slices 1 and 3 complete.

**Outputs:**

- 8 functions:
  - `buildOrchestratorSystemPrompt(context)` / `buildOrchestratorUserMessage(context)`
  - `buildPlannerSystemPrompt(context)` / `buildPlannerUserMessage(context)`
  - `buildImplementerSystemPrompt(context)` / `buildImplementerUserMessage(context)`
  - `buildReviewerSystemPrompt(context)` / `buildReviewerUserMessage(context)`
- Context types shaped around milestone/run/handoff data available on main
- Returns `ModelMessage[]` arrays ready for `ModelGateway.send()`

**Tests:**

- 4 describe blocks (one per role), ~10 tests total
- System prompts contain role identity, scope constraints, v1 node subset
- User messages include milestone name, acceptance criteria, prior handoff summary
- Deterministic: same input => same output

**Files Created:**

- `packages/extension/src/application/role-prompts.ts`
- `packages/extension/test/application/role-prompts.test.ts`

**Acceptance:**

- Pure functions, zero side effects, no VS Code/storage imports
- All prompts mention role identity
- Orchestrator prompt mentions v1 node constraints
- Planner prompt includes acceptance criteria from milestone
- Implementer prompt includes task list from planner handoff
- Reviewer prompt includes implementation summary from implementer handoff

**Estimated Size:** ~200 lines source + ~120 lines tests

---

## Slice 5 — Handoff Artifact Builders

**Goal:** Make handoff payload creation explicit before the loop writes them.

**Inputs:** Slices 1, 3, 4 complete.

**Outputs:**

- Pure builder functions for each role handoff:
  - `buildOrchestratorHandoff(milestoneRecord) => OrchestratorHandoff`
  - `buildPlannerHandoff(modelResponse, milestoneId) => PlannerHandoff`
  - `buildImplementerHandoff(modelResponse, milestoneId) => ImplementerHandoff`
  - `buildReviewerHandoff(modelResponse, milestoneId) => ReviewerHandoff`
- Response parser helpers (extract structured data from model text output)
- Mapper: handoff payload => `ArtifactRecord` write intent (type, title, uri shape)

**Tests:**

- Unit tests for each handoff artifact shape
- Contract round-trip: output validates against shared schemas
- Malformed model response handling (graceful defaults, not crashes)

**Files Created:**

- `packages/extension/src/application/handoffs.ts`
- `packages/extension/test/application/handoffs.test.ts`

**Acceptance:**

- Each phase can emit a stable typed handoff artifact
- Handoff payloads validate against `OrchestratorHandoffSchema`, `PlannerHandoffSchema`, etc.
- No VS Code dependencies, no storage side effects

**Estimated Size:** ~150 lines source + ~100 lines tests

---

## Slice 6 — Copilot Model Gateway Adapter

**Goal:** Implement the VS Code `lm` adapter behind the model port.

**Inputs:** Slices 2 and 3 complete.

**Outputs:**

- `CopilotModelGateway` implements `ModelGateway`
- Uses `vscode.lm.selectChatModels()` for model selection
- `send()` collects full response text from `LanguageModelChatResponse`
- `stream()` iterates `LanguageModelChatResponse.text` async iterable, calls `onChunk`
- `LanguageModelApiLike` seam interface for testing

**Tests:**

- Mocked model selection returning a stub model
- `send()` returns concatenated text from streamed fragments
- `stream()` calls `onChunk` for each fragment
- No model found => throws descriptive error
- Request failure => propagates error
- AbortSignal/CancellationToken passthrough if VS Code API supports it

**Files Created:**

- `packages/extension/src/copilot/copilot-model-gateway.ts`
- `packages/extension/test/copilot/copilot-model-gateway.test.ts`

**Acceptance:**

- Gateway returns deterministic strings/chunks from mocked VS Code APIs
- No live provider calls
- Clean separation: only this file imports vscode.lm types
- `pnpm typecheck && pnpm test` passes

**Estimated Size:** ~120 lines source + ~100 lines tests

---

## Slice 7 — Chat Participant Registration + Command Parsing

**Goal:** Expose `/plan`, `/run`, `/status` through Copilot chat without starting the orchestration loop.

**Inputs:** Slices 2 and 3 complete.

**Outputs:**

- `ChatApiLike` seam interface (testable without vscode)
- `buildChatHandler()` that dispatches slash commands:
  - `/plan` => acknowledge plan creation intent (placeholder response)
  - `/run` => acknowledge run start intent (placeholder response)
  - `/status` => report current orchestration state (or "no active run")
- `registerChatParticipant(chatApi, handler)` wiring function
- Runtime integration: add `ChatApiLike?` to `RuntimeDependencies`, wire in `activateAttractor`
- Extension.ts: extract `ChatApiLike` from vscode namespace, pass to `activateAttractor`

**Tests:**

- Command parsing: `/plan`, `/run`, `/status` recognized correctly
- Unknown command => helpful fallback response
- Registration test: chat participant registered when chatApi is provided
- Registration test: no error when chatApi is undefined (graceful skip)
- Activation smoke test updated for new optional dependency

**Files Created/Modified:**

- NEW: `packages/extension/src/chat/attractor-chat-participant.ts`
- MODIFY: `packages/extension/src/runtime.ts`
- MODIFY: `packages/extension/src/extension.ts`
- NEW: `packages/extension/test/chat/attractor-chat-participant.test.ts`
- MODIFY: `packages/extension/test/smoke/activation.test.ts`

**Acceptance:**

- Participant registers cleanly with mock chat API
- Commands are recognized deterministically in tests
- Activation still works when chatApi is undefined (backward compat)
- `pnpm typecheck && pnpm test` passes

**Estimated Size:** ~150 lines source + ~120 lines tests

---

## Slice 8 — Orchestration Loop Core with Deterministic Mocked-Model Tests

**Goal:** Implement the 4-role execution loop as pure application logic.

**Inputs:** Slices 1, 3, 4, 5 complete.

**Outputs:**

- `OrchestrationLoop` class with:
  - `execute(options: OrchestrationOptions)` — drives full milestone progression
  - Options include: `modelGateway`, `milestones`, `runId`, `onStateChange`, `onHandoff`, `onError`, `signal?`
- Per-milestone 4-phase execution: orchestrator => planner => implementer => reviewer
- Topological milestone ordering (respects `MilestoneRecord.order`)
- State emission: calls `onStateChange(OrchestrationStatePayload)` at each phase transition
- Handoff emission: calls `onHandoff(handoffPayload)` between phases
- Error handling: reviewer rejection triggers retry or failure based on policy
- Abort support via `AbortSignal`

**Tests (deterministic, mocked model):**

- `StubModelGateway` returning canned responses per role
- Full success path: all 4 roles complete for single milestone
- Multi-milestone: phases execute in order across milestones
- Planner failure: propagates error, emits failed state
- Implementer failure: propagates error, emits failed state
- Reviewer rejection: emits failed state (v1: no auto-retry)
- State transition ordering: waiting -> running -> done for each role
- Abort mid-execution: loop stops, emits appropriate state
- Topological sort correctness for milestone ordering

**Files Created:**

- `packages/extension/src/application/orchestration-loop.ts`
- `packages/extension/test/application/orchestration-loop.test.ts`

**Acceptance:**

- Loop runs entirely under mocks
- Emits expected phase states at each transition
- Emits handoff artifacts between phases
- Zero VS Code dependencies
- No storage side effects (pure orchestration logic)
- `pnpm typecheck && pnpm test` passes

**Estimated Size:** ~250 lines source + ~200 lines tests

---

## Slice 9 — Runtime + Bridge Command Wiring for Run Control

**Goal:** Replace current no-op dashboard commands with actual orchestration entrypoints.

**Inputs:** Slices 6, 7, 8 complete.

**Outputs:**

- Inject `ModelGateway` into `RuntimeDependencies` (with `NoOpModelGateway` default)
- `plan.run` command handler: creates `OrchestrationLoop`, starts execution
- `run.cancel` command handler: signals abort to running loop
- `run.resume` / `run.retry`: thin v1 implementations (resume = restart from last milestone; retry = full restart) or explicit "not yet supported" responses
- `plan.create` handler: create plan record in storage (or placeholder)
- Emit `orchestration.state` through existing `WebviewPostTarget` pattern in bridge
- Persist handoff artifacts through `artifactRegistry`
- Update `RunRecord` status during orchestration

**Tests:**

- Bridge tests: `plan.run` message triggers orchestration start (with stub gateway)
- Bridge tests: `run.cancel` aborts running orchestration
- Bridge tests: `plan.create` creates a plan or returns ack
- Runtime tests: `ModelGateway` injection works; defaults to no-op
- State emission test: orchestration progress posts `orchestration.state` to webview
- Existing bridge tests still pass unchanged

**Files Modified:**

- `packages/extension/src/runtime.ts`
- `packages/extension/src/dashboard/bridge.ts`
- `packages/extension/test/dashboard/bridge.test.ts`
- `packages/extension/test/smoke/activation.test.ts`
- POSSIBLY NEW: `packages/extension/src/application/run-orchestrator.ts` (thin coordinator if runtime.ts would get too large)

**Acceptance:**

- Dashboard commands are no longer no-ops
- A mocked run can start and emit orchestration progress to webview
- Cancellation stops the loop
- All existing 319+ tests still pass
- `pnpm typecheck && pnpm lint && pnpm test` passes

**Estimated Size:** ~200 lines source changes + ~150 lines test changes

---

## Slice 10 — Webview Orchestration State Handling

**Goal:** Consume the new `orchestration.state` outbound message in the webview.

**Inputs:** Slices 1 and 9 complete.

**Outputs:**

- `message-dispatch.ts`: handle `"orchestration.state"` message type
- `store.ts`: add `orchestration` payload slot to store state
- Surface component: minimal 4-role phase strip showing role name + status badge
- Integrate into existing run surface or as standalone orchestration surface

**Tests:**

- Dispatch test: `orchestration.state` message sets store correctly
- Dispatch test: returns `true` for valid orchestration state
- Store test: orchestration payload is accessible after dispatch
- Surface test: renders 4 phase badges with correct statuses
- Existing dispatch tests still pass

**Files Modified:**

- `packages/webview/src/app/message-dispatch.ts`
- `packages/webview/src/app/store.ts`
- POSSIBLY NEW: `packages/webview/src/orchestration/` surface module
- `packages/webview/test/app/message-dispatch.test.ts`
- POSSIBLY NEW: `packages/webview/test/orchestration/` tests

**Acceptance:**

- Webview accepts `orchestration.state` and routes it to store
- Phase strip renders deterministically in tests
- No regressions in existing webview behavior
- `pnpm typecheck && pnpm lint && pnpm test` passes

**Estimated Size:** ~120 lines source + ~80 lines tests

---

## Dependency Graph

```
Slice 1 (shared contracts)
  |
  +---> Slice 2 (vscode types)
  |       |
  |       +---> Slice 6 (copilot gateway) --+
  |       |                                  |
  |       +---> Slice 7 (chat participant) --+
  |                                          |
  +---> Slice 3 (model port)                 |
  |       |                                  |
  |       +---> Slice 4 (role prompts)       |
  |       |       |                          |
  |       |       +---> Slice 5 (handoffs)   |
  |       |               |                  |
  |       |               +---> Slice 8 -----+
  |       |                     (orch loop)  |
  |       |                          |       |
  |       +--------------------------+       |
  |                                  |       |
  |                          Slice 9 (runtime wiring)
  |                                  |
  +------> Slice 10 (webview handling)
```

## Wave Schedule (Parallelization)

| Wave | Slices  | Dependencies Met       |
| ---- | ------- | ---------------------- |
| A    | 1       | (none)                 |
| B    | 2, 3    | 1                      |
| C    | 4, 6, 7 | 1+3 for 4; 2+3 for 6,7 |
| D    | 5       | 1+3+4                  |
| E    | 8       | 1+3+4+5                |
| F    | 9       | 6+7+8                  |
| G    | 10      | 1+9                    |

## Agent Assignment Recommendations

| Role                   | Slices               | Rationale                                                                        |
| ---------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `@ttd-planner`         | 1, 4, 8              | Schema design, prompt design, loop architecture need careful acceptance criteria |
| `@ttd-implementer`     | 2, 3, 5, 6, 7, 9, 10 | Focused implementation with clear specs                                          |
| `@code-reviewer`       | After 1, 8, 9        | Critical integration points need review                                          |
| `@plan-drift-reviewer` | After 9              | Final drift check before M4 declared complete                                    |

## Quality Gate (per slice)

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test
```

Must pass after every slice commit. No exceptions.
