# Wire Orchestration End-to-End

## TL;DR

> **Quick Summary**: Wire the 3 placeholder gaps in the Attractor VS Code extension (model gateway, orchestration loop, chat commands) and add structured logging so that "Run Plan" from the dashboard and `/run` from chat actually execute the orchestration pipeline end-to-end.
>
> **Deliverables**:
>
> - Real `CopilotModelGateway` wired at activation (replaces `NoOpModelGateway`)
> - `startOrchestration` loads plan + milestones from storage, runs `OrchestrationLoop.execute()`
> - Chat `/run` triggers orchestration, `/plan` lists plans, `/status` shows active runs
> - Structured lifecycle logging visible in "Attractor" Output channel
> - Updated tests covering all new wiring (baseline 503 tests preserved)
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 3 waves + final verification
> **Critical Path**: Task 1 (gateway adapter) → Task 3 (startOrchestration) → Task 5 (chat /run) → Task 7 (logging) → F1–F4 (verification)

---

## Context

### Original Request

Wire the 3 placeholder gaps in the Attractor VS Code extension so orchestration actually executes when "Run Plan" is clicked or `/run` is typed in chat. Add debugging/observability infrastructure via the Output channel.

### Interview Summary

**Key Discussions**:

- Extension is a pnpm monorepo (shared, extension, webview) — dashboard, OrchestrationLoop, CopilotModelGateway, storage all fully implemented but not wired
- 3 gaps: (1) `startOrchestration` placeholder in runtime.ts, (2) `NoOpModelGateway` default, (3) chat commands return placeholder text
- User confirmed: proceed with wiring, add debugging
- `/run` wiring: Direct injection — inject services/orchestration into `buildChatHandler` via closure
- `/plan` command: List existing plans from `planRegistry.list()`
- `/status` command: Wire to real active run state

**Research Findings**:

- `OrchestrationLoop.execute()` is stateless — all via `OrchestrationOptions` (modelGateway, milestones, runId, planTitle, planGoal, callbacks, signal)
- `CopilotModelGateway` constructor needs `LanguageModelApiLike` adapter wrapping `vscode.lm`
- Bridge `plan.run` handler already calls `orchestration.startOrchestration` correctly — just needs the implementation to actually work
- `MilestoneRecord.title` maps to `MilestoneInput.name` AND `description` (no description field on MilestoneRecord)
- 503 existing tests pass — this is the regression baseline

### Metis Review

**Identified Gaps** (addressed):

- `MilestoneRecord` has no `description` field but `MilestoneInput` requires one → map `title` to both `name` and `description` with code comment
- Chat handler signature change will break 6 existing tests → update them as part of the refactor task
- `vscode.lm` may return empty models array → `CopilotModelGateway` already throws, ensure `startOrchestration` catches and logs
- `"canceled" as AgentRoleStatus` cast in OrchestrationLoop is a pre-existing bug → out of scope, do not touch
- Bridge `plan.run` fires toast before verifying orchestration succeeded → existing behavior, do not change

---

## Work Objectives

### Core Objective

Replace all placeholder/no-op wiring with real implementations so the orchestration pipeline executes end-to-end from either the dashboard webview or the `@attractor` chat participant.

### Concrete Deliverables

- `packages/extension/src/extension.ts` — `createLanguageModelApi()` adapter + pass `CopilotModelGateway` in dependencies
- `packages/extension/src/runtime.ts` — real `startOrchestration` implementation with plan loading, milestone mapping, OrchestrationLoop invocation, RunRecord lifecycle, and structured logging
- `packages/extension/src/chat/attractor-chat-participant.ts` — parameterized `buildChatHandler` with `/run`, `/plan`, `/status` implementations
- `packages/extension/test/` — new and updated tests covering all wiring

### Definition of Done

- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm test --run` passes (all 503+ tests green)
- [ ] `pnpm lint` passes
- [ ] F5 → Dashboard → "Run Plan" → Output channel shows orchestration lifecycle logs
- [ ] `@attractor /run` in chat triggers orchestration (or graceful error if no plan)
- [ ] `@attractor /plan` lists stored plans
- [ ] `@attractor /status` shows active run info

### Must Have

- Real `CopilotModelGateway` wired at extension activation
- `startOrchestration` that loads plan, maps milestones, runs OrchestrationLoop, updates RunRecord
- Chat commands with real behavior (not placeholders)
- Structured Output channel logging for orchestration lifecycle
- All existing tests still pass

### Must NOT Have (Guardrails)

- **DO NOT** modify `orchestration-loop.ts` — FROZEN
- **DO NOT** modify `copilot-model-gateway.ts` — FROZEN
- **DO NOT** modify `ports.ts` (ModelGateway interface) — FROZEN
- **DO NOT** modify `bridge.ts` — FROZEN (already correctly dispatches)
- **DO NOT** modify anything in `packages/shared` (Zod schemas) — FROZEN
- **DO NOT** modify anything in `packages/webview` — FROZEN
- **DO NOT** add `vscode.window.showErrorMessage` calls (codebase deliberately avoids them)
- **DO NOT** implement `run.resume` or `run.retry` — remain unsupported stubs
- **DO NOT** add new npm dependencies or packages
- **DO NOT** create tests requiring VS Code extension host launch or real Copilot API calls
- **DO NOT** add concurrent run guards (out of scope)
- **DO NOT** change the `RuntimeDependencies` interface beyond adding any needed parameters

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision

- **Infrastructure exists**: YES (Vitest)
- **Automated tests**: Tests-after (update existing + add new for wiring)
- **Framework**: Vitest (`pnpm test --run`)
- **Baseline**: 503 tests must pass at every commit

### QA Policy

Every task includes agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Extension wiring**: Use Bash — `pnpm typecheck && pnpm test --run && pnpm lint`
- **E2E verification**: Use interactive_bash (tmux) — F5 launch, dashboard interaction, Output channel inspection (deferred to Final Verification)

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — isolated foundation):
├── Task 1: Model gateway adapter in extension.ts [quick]
├── Task 2: Chat handler signature refactor (structural only) [quick]

Wave 2 (After Wave 1 — core wiring, parallel):
├── Task 3: startOrchestration implementation in runtime.ts [deep]
├── Task 4: Chat /plan command implementation [quick]
├── Task 5: Chat /run command implementation [unspecified-high]
├── Task 6: Chat /status command implementation [quick]

Wave 3 (After Wave 2 — observability layer):
├── Task 7: Structured logging throughout orchestration lifecycle [unspecified-high]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: Task 1 → Task 3 → Task 5 → Task 7 → F1-F4 → user okay
Parallel Speedup: ~50% faster than sequential
Max Concurrent: 4 (Wave 2)
```

### Dependency Matrix

| Task                        | Depends On | Blocks  |
| --------------------------- | ---------- | ------- |
| 1 (Gateway adapter)         | —          | 3, 5    |
| 2 (Chat signature refactor) | —          | 4, 5, 6 |
| 3 (startOrchestration)      | 1          | 5, 7    |
| 4 (Chat /plan)              | 2          | 7       |
| 5 (Chat /run)               | 1, 2, 3    | 7       |
| 6 (Chat /status)            | 2          | 7       |
| 7 (Logging)                 | 3, 4, 5, 6 | F1-F4   |
| F1-F4                       | 7          | —       |

### Agent Dispatch Summary

- **Wave 1**: 2 tasks — T1 → `quick`, T2 → `quick`
- **Wave 2**: 4 tasks — T3 → `deep`, T4 → `quick`, T5 → `unspecified-high`, T6 → `quick`
- **Wave 3**: 1 task — T7 → `unspecified-high`
- **FINAL**: 4 tasks — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Wire CopilotModelGateway at Extension Activation

  **What to do**:
  - In `packages/extension/src/extension.ts`, add a `createLanguageModelApi()` factory function following the same adapter pattern as `createWindowApi()` and `createChatApi()` (lines 12–55)
  - The adapter wraps `vscode.lm.selectChatModels` and `vscode.LanguageModelChatMessage.User`/`.Assistant` into `LanguageModelApiLike` shape: `{ selectChatModels(selector), createChatMessage(role, content) }`
  - Import `CopilotModelGateway` from `../copilot/copilot-model-gateway`
  - In the `activate()` function, construct `new CopilotModelGateway(createLanguageModelApi())` and pass it as `modelGateway` in the dependencies object to `activateAttractor()`
  - Add a unit test in `packages/extension/test/` verifying that when `modelGateway` is provided in dependencies, it flows through to the orchestration context (not replaced by NoOpModelGateway)

  **Must NOT do**:
  - Do NOT modify `copilot-model-gateway.ts` or `ports.ts`
  - Do NOT add error handling for missing Copilot — `CopilotModelGateway` already handles that internally
  - Do NOT change the `RuntimeDependencies` interface — `modelGateway` is already an optional field

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single-file change (extension.ts) + one test file. Small, well-defined, follows existing pattern.
  - **Skills**: []
    - No special skills needed — straightforward TypeScript wiring
  - **Skills Evaluated but Omitted**:
    - `frontend-design`: No UI work involved

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 5
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `packages/extension/src/extension.ts:12-55` — `createWindowApi()` and `createChatApi()` adapter factory pattern. Follow this EXACT pattern for `createLanguageModelApi()`. Each wraps a VS Code API namespace into a testable interface.
  - `packages/extension/src/extension.ts:57-65` — `activate()` function where dependencies are assembled and passed to `activateAttractor()`. Add `modelGateway` here.

  **API/Type References** (contracts to implement against):
  - `packages/extension/src/copilot/copilot-model-gateway.ts` — `LanguageModelApiLike` interface: `{ selectChatModels(selector: { vendor: string; family: string }): Thenable<ChatModelLike[]>; createChatMessage(role: LanguageModelChatMessageRole, content: string): LanguageModelChatMessageLike }`. Your adapter MUST match this shape.
  - `packages/extension/src/copilot/copilot-model-gateway.ts` — Constructor: `new CopilotModelGateway(api: LanguageModelApiLike, defaultModelFamily?: string)`
  - `packages/extension/src/application/ports.ts` — `ModelGateway` interface that `CopilotModelGateway` implements
  - `packages/extension/src/runtime.ts:139` — `const modelGateway = dependencies.modelGateway ?? new NoOpModelGateway()` — this is where your injected gateway will be used

  **Test References** (testing patterns to follow):
  - `packages/extension/test/copilot/copilot-model-gateway.test.ts` — Shows how `LanguageModelApiLike` is mocked in tests
  - `packages/extension/test/smoke/activation.test.ts` — Shows activation test pattern with `makeMinimalContext`

  **WHY Each Reference Matters**:
  - `extension.ts:12-55`: You need to see the exact adapter wrapping pattern — how `vscode.window` → `WindowApiLike` works, then replicate for `vscode.lm` → `LanguageModelApiLike`
  - `copilot-model-gateway.ts`: The `LanguageModelApiLike` interface definition is the contract your adapter must satisfy
  - `runtime.ts:139`: Confirms the fallback logic — your gateway replaces `NoOpModelGateway` only when provided

  **Acceptance Criteria**:
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm test --run` passes (503+ tests, 0 failures)
  - [ ] New test confirms `activateAttractor({ modelGateway: myGateway })` uses provided gateway

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Gateway adapter follows existing factory pattern
    Tool: Bash
    Preconditions: Clean build state
    Steps:
      1. Run `pnpm typecheck` in workspace root
      2. Run `pnpm test --run` in workspace root
      3. Grep extension.ts for `createLanguageModelApi` to verify function exists
      4. Grep extension.ts for `CopilotModelGateway` to verify import and construction
      5. Grep extension.ts for `modelGateway` in the activate() dependencies object
    Expected Result: Typecheck passes, all tests pass, all three grep patterns found
    Failure Indicators: Typecheck errors mentioning LanguageModelApiLike, test failures, missing patterns
    Evidence: .sisyphus/evidence/task-1-gateway-wiring.txt

  Scenario: NoOpModelGateway is no longer used in production activation
    Tool: Bash
    Preconditions: Task 1 changes applied
    Steps:
      1. Read `extension.ts` activate() function
      2. Verify `modelGateway: new CopilotModelGateway(createLanguageModelApi())` is in dependencies
      3. Run the new test that confirms gateway flows through
    Expected Result: Test passes confirming real gateway is used when provided
    Failure Indicators: Test shows NoOpModelGateway still being used in non-test path
    Evidence: .sisyphus/evidence/task-1-noop-replaced.txt
  ```

  **Commit**: YES (Commit 1)
  - Message: `feat(extension): wire CopilotModelGateway at activation`
  - Files: `packages/extension/src/extension.ts`, `packages/extension/test/...`
  - Pre-commit: `pnpm typecheck && pnpm test --run`

- [ ] 2. Refactor Chat Handler Signature for Service Injection

  **What to do**:
  - Modify `buildChatHandler()` in `packages/extension/src/chat/attractor-chat-participant.ts` to accept an options parameter containing the services and orchestration context it needs: `buildChatHandler(options: ChatHandlerDependencies)`
  - Define `ChatHandlerDependencies` interface: `{ services: StorageServices | null; orchestration: { startOrchestration, cancelOrchestration } | null; outputChannel: OutputChannelLike | null }`
  - Modify `registerChatParticipant` to accept and pass through the dependencies
  - Update the call site in `runtime.ts` where `registerChatParticipant` is called — pass the services and orchestration context
  - **This is a pure structural refactor** — command handlers still return placeholder text for now (behavior unchanged)
  - Update ALL 6 existing chat tests to use new signature (pass null/stub dependencies)
  - Use `lsp_find_references` on `buildChatHandler` and `registerChatParticipant` BEFORE making changes to find all call sites

  **Must NOT do**:
  - Do NOT change command behavior yet (that's Tasks 4-6)
  - Do NOT modify bridge.ts
  - Do NOT add new test assertions — just update existing tests to compile with new signature

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure refactor — change signature, update call sites, fix test compilation. No new logic.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `orchestration`: Not orchestrating work, just refactoring a signature

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Tasks 4, 5, 6
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `packages/extension/src/chat/attractor-chat-participant.ts` — Current `buildChatHandler()` with zero-arg signature and `registerChatParticipant(chatApi)` with single param. These are the exact functions to modify.
  - `packages/extension/src/runtime.ts:258` (approx) — Call site: `registerChatParticipant(dependencies.chatApi)`. Must update to pass services and orchestration context.

  **API/Type References**:
  - `packages/extension/src/runtime.ts` — `BridgeOrchestrationContext` interface shape (startOrchestration, cancelOrchestration) — the chat handler needs access to a subset of this
  - `packages/extension/src/storage/services.ts` — `StorageServices` type (planRegistry, runRegistry, etc.)

  **Test References**:
  - `packages/extension/test/chat/attractor-chat-participant.test.ts` — 6 existing tests that call `buildChatHandler()` with no args. ALL must be updated for new signature.
  - `packages/extension/test/integration/chat-participant.test.ts` — Integration tests for `registerChatParticipant`

  **WHY Each Reference Matters**:
  - `attractor-chat-participant.ts`: The file you're modifying — need to see current signature and handler dispatch logic
  - `runtime.ts:258`: The call site that must pass dependencies — need to see what's available in scope
  - Test files: Must update ALL of them or build breaks

  **Acceptance Criteria**:
  - [ ] `buildChatHandler` accepts `ChatHandlerDependencies` parameter
  - [ ] `registerChatParticipant` accepts and forwards dependencies
  - [ ] `runtime.ts` call site passes real services and orchestration context
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm test --run` passes (all 503+ tests green — existing tests updated for new signature)
  - [ ] All existing chat test assertions still pass (behavior unchanged)

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Signature refactor compiles and all tests pass
    Tool: Bash
    Preconditions: Clean build state
    Steps:
      1. Run `pnpm typecheck`
      2. Run `pnpm test --run`
      3. Grep attractor-chat-participant.ts for `ChatHandlerDependencies` interface
      4. Grep runtime.ts for the updated registerChatParticipant call with dependencies
    Expected Result: Typecheck clean, all 503+ tests pass, interface exists, call site updated
    Failure Indicators: Type errors in chat tests, missing interface, old zero-arg call site remains
    Evidence: .sisyphus/evidence/task-2-signature-refactor.txt

  Scenario: Existing placeholder behavior preserved
    Tool: Bash
    Preconditions: Task 2 changes applied
    Steps:
      1. Run chat-specific tests: `pnpm test --run -- --grep "chat"`
      2. Verify tests still assert placeholder markdown responses
    Expected Result: All chat tests pass with existing placeholder assertions intact
    Failure Indicators: Changed response text, missing test assertions
    Evidence: .sisyphus/evidence/task-2-behavior-preserved.txt
  ```

  **Commit**: YES (Commit 2)
  - Message: `refactor(chat): parameterize buildChatHandler for service injection`
  - Files: `packages/extension/src/chat/attractor-chat-participant.ts`, `packages/extension/src/runtime.ts`, `packages/extension/test/chat/*.test.ts`, `packages/extension/test/integration/chat-participant.test.ts`
  - Pre-commit: `pnpm typecheck && pnpm test --run`

- [ ] 3. Implement startOrchestration in runtime.ts

  **What to do**:
  - Replace the placeholder in `startOrchestration` (runtime.ts ~lines 144-163) with a real implementation that:
    1. Loads the plan from `services.planRegistry.getById(planId)` — if not found, throw/log error
    2. Loads milestones from `services.milestoneRegistry.listByPlanId(planId)` — if empty, throw/log error
    3. Maps `MilestoneRecord[]` → `MilestoneInput[]`: `{ id, name: record.title, order: record.order, description: record.title, acceptanceCriteria: record.acceptanceCriteria }` (use `title` for both `name` and `description` — add comment explaining MilestoneRecord lacks description field)
    4. Creates/updates a `RunRecord` via `services.runRegistry` with status `"running"` at start
    5. Instantiates `new OrchestrationLoop()` and calls `execute()` with `OrchestrationOptions`:
       - `modelGateway`: the wired gateway
       - `milestones`: mapped milestones sorted by `order`
       - `runId`: from parameters
       - `planTitle`: from loaded plan
       - `planGoal`: from loaded plan
       - `onStateChange`: callback that posts state to `runPanel` via `postMessage` (outbound message envelope format: `{ version: 1, type: "run.state", payload }`)
       - `onHandoff`: callback that saves handoff to `services.eventLog` and posts to panel
       - `onError`: callback that logs to OutputChannel and posts error state to panel
       - `signal`: from the AbortController (already wired)
    6. On successful completion: update RunRecord status to `"completed"` with `finishedAt` timestamp
    7. On error (catch): update RunRecord status to `"failed"`, log error to OutputChannel
  - Add unit tests in `packages/extension/test/` covering:
    - Happy path: plan found, milestones mapped, OrchestrationLoop.execute called with correct options
    - Plan not found: error thrown/logged
    - Empty milestones: error thrown/logged
    - Abort/cancel: controller.abort() stops execution
    - RunRecord lifecycle: saved as running at start, updated to completed/failed at end

  **Must NOT do**:
  - Do NOT modify `orchestration-loop.ts` — use it as-is
  - Do NOT modify `bridge.ts` — it already calls `startOrchestration` correctly
  - Do NOT add `showErrorMessage` calls
  - Do NOT implement concurrent run guards

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core wiring logic — requires understanding storage APIs, OrchestrationLoop options, webview messaging protocol, and error handling. Most complex task in the plan.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `orchestration`: This is code orchestration, not multi-agent orchestration skill

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6)
  - **Blocks**: Tasks 5, 7
  - **Blocked By**: Task 1 (needs real model gateway)

  **References**:

  **Pattern References**:
  - `packages/extension/src/runtime.ts:139-163` — Current placeholder code to replace. Shows `modelGateway`, `activeRuns` Map, AbortController wiring, and the `BridgeOrchestrationContext` shape.
  - `packages/extension/src/runtime.ts:100-135` — Storage services setup pattern. Shows how `services` variable is populated from `storageRoot`.
  - `packages/extension/src/dashboard/bridge.ts` — `handleWebviewMessage` `"plan.run"` case. Shows the outbound message envelope format `{ version: 1, requestId, type, payload }` that `runPanel.postMessage` must use.

  **API/Type References**:
  - `packages/extension/src/application/orchestration-loop.ts` — `OrchestrationLoop` class: `execute(options: OrchestrationOptions): Promise<void>`. `OrchestrationOptions`: `{ modelGateway, milestones: MilestoneInput[], runId, planTitle, planGoal, onStateChange, onHandoff, onError, signal? }`. `MilestoneInput`: `{ id, name, order, description, acceptanceCriteria: string[] }`.
  - `packages/shared/src/contracts/index.ts` — `PlanRecordSchema` (id, title, goal, status, repositories), `RunRecordSchema` (id, planId, status, attempt, timestamps), `MilestoneRecordSchema` (id, planId, title, order, status, acceptanceCriteria, nodeIds)
  - `packages/extension/src/storage/services.ts` — `StorageServices` shape: `planRegistry.getById()`, `milestoneRegistry.listByPlanId()`, `runRegistry.save()`, `eventLog.append()`

  **Test References**:
  - `packages/extension/test/application/orchestration-loop.test.ts` — Shows `StubModelGateway` usage, callback capturing via `vi.fn()`, abort testing pattern
  - `packages/extension/test/dashboard/bridge.test.ts` — Shows `plan.run` bridge test pattern with mock panel, mock services
  - `packages/extension/test/smoke/activation.test.ts` — Shows `makeMinimalServices` / `makeServices` test helpers

  **WHY Each Reference Matters**:
  - `runtime.ts:139-163`: The exact code to replace — must understand the AbortController wiring to preserve it
  - `orchestration-loop.ts`: The `OrchestrationOptions` interface is the contract — every field must be correctly populated
  - `bridge.ts`: The outbound message format — `onStateChange` callback must post messages in this exact envelope shape
  - `PlanRecordSchema/MilestoneRecordSchema`: The storage record shapes — need to know what fields are available for mapping
  - Test files: The testing patterns to follow — StubModelGateway, mock services, callback capture

  **Acceptance Criteria**:
  - [ ] `startOrchestration` loads plan from `planRegistry.getById(planId)`
  - [ ] Milestones loaded from `milestoneRegistry.listByPlanId(planId)` and mapped to `MilestoneInput[]`
  - [ ] `OrchestrationLoop.execute()` called with complete `OrchestrationOptions`
  - [ ] RunRecord saved with `"running"` at start, updated to `"completed"`/`"failed"` at end
  - [ ] `onStateChange` posts to panel in correct envelope format
  - [ ] Plan-not-found error handled gracefully (logged, not thrown to bridge)
  - [ ] Abort signal properly forwarded to OrchestrationLoop
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm test --run` passes (all tests green including new ones)

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Happy path — startOrchestration loads plan and runs loop
    Tool: Bash
    Preconditions: Task 1 complete (real gateway wired), mock services with plan and milestones
    Steps:
      1. Run new unit test that: creates mock planRegistry returning a plan, mock milestoneRegistry returning 2 milestones, StubModelGateway, mock panel
      2. Calls startOrchestration({ runId: "run-1", planId: "plan-1", panel: mockPanel })
      3. Asserts OrchestrationLoop.execute was called with { runId: "run-1", planTitle: plan.title, milestones: [mapped] }
      4. Asserts runRegistry.save called with status "running" then "completed"
      5. Asserts panel.postMessage called with run.state messages
    Expected Result: All assertions pass — loop invoked with correct options, RunRecord lifecycle correct
    Failure Indicators: execute() not called, wrong milestone mapping, missing RunRecord updates
    Evidence: .sisyphus/evidence/task-3-happy-path.txt

  Scenario: Plan not found — graceful error handling
    Tool: Bash
    Preconditions: Mock planRegistry.getById returns null
    Steps:
      1. Run test that calls startOrchestration with nonexistent planId
      2. Assert no unhandled exception thrown
      3. Assert OutputChannel receives error log containing "plan-1"
      4. Assert RunRecord NOT saved (or saved with "failed" status)
    Expected Result: Error logged, no crash, graceful degradation
    Failure Indicators: Unhandled exception, missing log, crash
    Evidence: .sisyphus/evidence/task-3-plan-not-found.txt

  Scenario: Abort cancels orchestration
    Tool: Bash
    Preconditions: Mock services, AbortController
    Steps:
      1. Start orchestration, then abort via controller
      2. Assert OrchestrationLoop receives abort signal
      3. Assert RunRecord updated appropriately
    Expected Result: Orchestration stops cleanly on abort
    Failure Indicators: Loop continues after abort, RunRecord not updated
    Evidence: .sisyphus/evidence/task-3-abort.txt
  ```

  **Commit**: YES (Commit 3)
  - Message: `feat(runtime): implement startOrchestration with OrchestrationLoop`
  - Files: `packages/extension/src/runtime.ts`, `packages/extension/test/...`
  - Pre-commit: `pnpm typecheck && pnpm test --run`

- [ ] 4. Implement Chat /plan Command

  **What to do**:
  - In `attractor-chat-participant.ts`, update the `"plan"` case in the command handler to:
    1. Check if `services` is available (non-null). If not, respond with "Attractor storage not initialized."
    2. Call `services.planRegistry.list()` to get all plans
    3. If no plans exist, respond with helpful markdown: "No plans found. Use the Attractor dashboard to create a plan."
    4. If plans exist, format them as a markdown list showing: title, status, goal (truncated), and number of milestones
  - Add tests:
    - `/plan` with no services → "storage not initialized" message
    - `/plan` with empty plan list → "No plans found" message
    - `/plan` with 2 plans → markdown list with titles and statuses

  **Must NOT do**:
  - Do NOT create new plans from chat (just list existing)
  - Do NOT add plan creation logic
  - Do NOT modify bridge.ts

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single command handler update in one file + straightforward tests
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5, 6)
  - **Blocks**: Task 7
  - **Blocked By**: Task 2 (needs parameterized handler)

  **References**:

  **Pattern References**:
  - `packages/extension/src/chat/attractor-chat-participant.ts` — Current `"plan"` case handler (placeholder). Follow the existing `stream.markdown()` pattern for responses.

  **API/Type References**:
  - `packages/extension/src/storage/services.ts` — `planRegistry.list(): Promise<PlanRecord[]>`
  - `packages/shared/src/contracts/index.ts` — `PlanRecordSchema`: `{ id, title, goal, status, repositories }`

  **Test References**:
  - `packages/extension/test/chat/attractor-chat-participant.test.ts` — Existing chat test pattern with mock stream object

  **WHY Each Reference Matters**:
  - `attractor-chat-participant.ts`: The file to modify and the markdown response pattern to follow
  - `planRegistry.list()`: The API to call — need to know return type shape
  - Existing chat tests: Pattern for asserting `stream.markdown()` calls

  **Acceptance Criteria**:
  - [ ] `/plan` with services lists all plans as markdown
  - [ ] `/plan` with no plans shows "No plans found" guidance
  - [ ] `/plan` with null services shows initialization error
  - [ ] `pnpm typecheck && pnpm test --run` passes

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: /plan lists existing plans
    Tool: Bash
    Preconditions: Mock services with planRegistry returning 2 plans
    Steps:
      1. Run test: invoke handler with command "plan", mock services with 2 plans
      2. Assert stream.markdown called with text containing both plan titles
      3. Assert stream.markdown contains plan status indicators
    Expected Result: Both plans listed with titles and statuses
    Failure Indicators: Missing plans, wrong format, exception
    Evidence: .sisyphus/evidence/task-4-plan-list.txt

  Scenario: /plan with no plans shows guidance
    Tool: Bash
    Preconditions: Mock services with empty planRegistry
    Steps:
      1. Run test: invoke handler with command "plan", empty plan list
      2. Assert stream.markdown contains "No plans found"
    Expected Result: Helpful "no plans" message displayed
    Failure Indicators: Empty response, exception
    Evidence: .sisyphus/evidence/task-4-no-plans.txt
  ```

  **Commit**: YES (groups with Commit 4)
  - Message: `feat(chat): wire /plan, /run, /status commands`
  - Files: `packages/extension/src/chat/attractor-chat-participant.ts`, tests
  - Pre-commit: `pnpm typecheck && pnpm test --run`

- [ ] 5. Implement Chat /run Command

  **What to do**:
  - In `attractor-chat-participant.ts`, update the `"run"` case to:
    1. Check if `orchestration` context is available. If not, respond with "Orchestration not available."
    2. Parse the user's prompt for a plan ID (e.g., `@attractor /run plan-abc123`). If no plan ID provided, list available plans from `services.planRegistry.list()` and ask user to specify.
    3. Generate a new run ID (use `crypto.randomUUID()` or the project's ID generation pattern)
    4. Call `orchestration.startOrchestration({ runId, planId, panel: null, signal: token })` where `token` is the `CancellationToken` from the handler args
    5. Stream a response: "Starting orchestration run `{runId}` for plan `{planId}`..."
    6. Handle errors from startOrchestration gracefully — stream error message, don't throw
  - Note: `panel` parameter — chat doesn't have a webview panel. `startOrchestration` should handle `panel: null` gracefully (skip panel.postMessage if no panel). This may require a minor null check in the startOrchestration implementation from Task 3.
  - Add tests:
    - `/run plan-123` with services → startOrchestration called with correct planId
    - `/run` with no plan ID → lists plans and asks user to specify
    - `/run` with no orchestration context → error message
    - `/run` that fails → error message streamed

  **Must NOT do**:
  - Do NOT implement `run.resume` or `run.retry`
  - Do NOT modify bridge.ts
  - Do NOT add showErrorMessage calls

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: More complex than /plan — needs to parse input, generate IDs, call orchestration, handle errors, and deal with null panel edge case
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (but depends on Tasks 1, 2, 3)
  - **Parallel Group**: Wave 2 — but practically runs after Task 3 completes due to dependency
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 1 (gateway), 2 (signature), 3 (startOrchestration impl)

  **References**:

  **Pattern References**:
  - `packages/extension/src/chat/attractor-chat-participant.ts` — Current `"run"` case handler (placeholder). The handler receives `(request, context, stream, token)` — `request.prompt` contains user text after the command.
  - `packages/extension/src/dashboard/bridge.ts` — `"plan.run"` case shows how bridge calls `orchestration.startOrchestration({ runId, planId, panel })`. Chat should follow same pattern but with `panel: null`.

  **API/Type References**:
  - `packages/extension/src/runtime.ts` — `BridgeOrchestrationContext.startOrchestration` signature: `({ runId, planId, panel, signal }) => Promise<void>`
  - VS Code `CancellationToken` — passed as 4th arg to chat handler. May need adapter to AbortSignal for startOrchestration.

  **Test References**:
  - `packages/extension/test/chat/attractor-chat-participant.test.ts` — Existing chat test pattern
  - `packages/extension/test/dashboard/bridge.test.ts` — `plan.run` test shows orchestration call assertion pattern

  **WHY Each Reference Matters**:
  - `attractor-chat-participant.ts`: The handler you're modifying — need to see how `request.prompt` is accessed
  - `bridge.ts plan.run`: Shows the startOrchestration call pattern to replicate in chat
  - `CancellationToken`: May need to adapt VS Code's CancellationToken to AbortSignal for startOrchestration

  **Acceptance Criteria**:
  - [ ] `/run plan-123` calls startOrchestration with planId "plan-123"
  - [ ] `/run` without plan ID lists available plans
  - [ ] `/run` with no orchestration context shows error message
  - [ ] Error from startOrchestration is caught and streamed as markdown
  - [ ] `startOrchestration` handles null panel (no crash on postMessage)
  - [ ] `pnpm typecheck && pnpm test --run` passes

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: /run with plan ID triggers orchestration
    Tool: Bash
    Preconditions: Mock orchestration context with startOrchestration spy
    Steps:
      1. Run test: invoke handler with command "run", prompt "plan-abc"
      2. Assert startOrchestration called once with { planId: "plan-abc" }
      3. Assert stream.markdown called with "Starting orchestration" message
    Expected Result: Orchestration started with correct plan ID
    Failure Indicators: startOrchestration not called, wrong planId
    Evidence: .sisyphus/evidence/task-5-run-with-plan.txt

  Scenario: /run without plan ID prompts user
    Tool: Bash
    Preconditions: Mock services with 2 plans
    Steps:
      1. Run test: invoke handler with command "run", empty prompt
      2. Assert stream.markdown contains plan list and guidance to specify plan ID
    Expected Result: User sees available plans and instructions
    Failure Indicators: Crash, empty response, orchestration started without plan
    Evidence: .sisyphus/evidence/task-5-run-no-plan.txt

  Scenario: /run orchestration failure handled gracefully
    Tool: Bash
    Preconditions: Mock startOrchestration that rejects with error
    Steps:
      1. Run test: invoke handler with command "run plan-fail"
      2. Assert stream.markdown contains error message text
      3. Assert no unhandled exception
    Expected Result: Error message streamed, no crash
    Failure Indicators: Unhandled rejection, missing error message
    Evidence: .sisyphus/evidence/task-5-run-error.txt
  ```

  **Commit**: YES (groups with Commit 4)
  - Message: `feat(chat): wire /plan, /run, /status commands`
  - Files: `packages/extension/src/chat/attractor-chat-participant.ts`, tests
  - Pre-commit: `pnpm typecheck && pnpm test --run`

- [ ] 6. Implement Chat /status Command

  **What to do**:
  - In `attractor-chat-participant.ts`, update the `"status"` case to:
    1. Check if `services` is available. If not, respond with "Attractor storage not initialized."
    2. Query active runs from `services.runRegistry` (list runs with status `"running"`)
    3. If no active runs, respond: "No active orchestration runs."
    4. If active runs exist, format as markdown showing: run ID, plan ID, status, started timestamp
  - Add tests:
    - `/status` with no active runs → "No active runs" message
    - `/status` with active runs → markdown list
    - `/status` with no services → initialization error

  **Must NOT do**:
  - Do NOT add run management (pause/cancel) to the status command
  - Do NOT modify bridge.ts

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple read-only query + markdown formatting. Follows same pattern as /plan.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4, 5)
  - **Blocks**: Task 7
  - **Blocked By**: Task 2 (needs parameterized handler)

  **References**:

  **Pattern References**:
  - `packages/extension/src/chat/attractor-chat-participant.ts` — Current `"status"` case handler (placeholder)
  - Task 4's /plan implementation — Follow same pattern (null check, list, format markdown)

  **API/Type References**:
  - `packages/extension/src/storage/services.ts` — `runRegistry` API (list/query methods)
  - `packages/shared/src/contracts/index.ts` — `RunRecordSchema`: `{ id, planId, status, attempt, startedAt, finishedAt }`

  **Test References**:
  - `packages/extension/test/chat/attractor-chat-participant.test.ts` — Same test file, follow pattern from /plan tests

  **WHY Each Reference Matters**:
  - `attractor-chat-participant.ts`: The handler to modify
  - `runRegistry`: Need to know the query API for listing active runs
  - `RunRecordSchema`: Fields available for display

  **Acceptance Criteria**:
  - [ ] `/status` with active runs shows run details
  - [ ] `/status` with no active runs shows "No active runs"
  - [ ] `/status` with null services shows initialization error
  - [ ] `pnpm typecheck && pnpm test --run` passes

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: /status shows active runs
    Tool: Bash
    Preconditions: Mock runRegistry returning 1 active run
    Steps:
      1. Run test: invoke handler with command "status"
      2. Assert stream.markdown contains run ID and status "running"
    Expected Result: Active run displayed with correct details
    Failure Indicators: Missing run info, wrong format
    Evidence: .sisyphus/evidence/task-6-active-runs.txt

  Scenario: /status with no active runs
    Tool: Bash
    Preconditions: Mock runRegistry returning empty list
    Steps:
      1. Run test: invoke handler with command "status"
      2. Assert stream.markdown contains "No active"
    Expected Result: Clear "no active runs" message
    Failure Indicators: Empty response, exception
    Evidence: .sisyphus/evidence/task-6-no-runs.txt
  ```

  **Commit**: YES (groups with Commit 4)
  - Message: `feat(chat): wire /plan, /run, /status commands`
  - Files: `packages/extension/src/chat/attractor-chat-participant.ts`, tests
  - Pre-commit: `pnpm typecheck && pnpm test --run`

- [ ] 7. Add Structured Orchestration Lifecycle Logging

  **What to do**:
  - In the `startOrchestration` implementation (runtime.ts), add structured log messages to the OutputChannel at each lifecycle point:
    - Orchestration start: `"Attractor: orchestration started — run={runId} plan={planId}"`
    - Plan loaded: `"Attractor: plan loaded — {plan.title} ({milestoneCount} milestones)"`
    - Each milestone start (via `onStateChange`): `"Attractor: milestone {order}/{total} — {name}"`
    - Each phase start (via `onStateChange`): `"Attractor: phase {role} — milestone {name}"`
    - Handoff (via `onHandoff`): `"Attractor: handoff {fromRole} → {toRole} — {reason}"`
    - Error (via `onError`): `"Attractor: error in {role} at milestone {milestoneId} — {error.message}"`
    - Orchestration complete: `"Attractor: orchestration completed — run={runId} duration={ms}ms"`
    - Orchestration failed: `"Attractor: orchestration failed — run={runId} error={message}"`
    - Orchestration canceled: `"Attractor: orchestration canceled — run={runId}"`
  - In chat command handlers, add minimal logging:
    - `/run` command: `"Attractor: /run command — plan={planId}"`
    - `/plan` command: `"Attractor: /plan command — {planCount} plans found"`
  - Use the `outputChannel` from `ChatHandlerDependencies` (or from the runtime scope closure)
  - Add tests asserting log messages appear in a captured outputChannel mock:
    - Test that orchestration start/end logs appear
    - Test that milestone progress logs appear
    - Test that error logs include error message

  **Must NOT do**:
  - Do NOT add `createOutputChannel` — it already exists
  - Do NOT use `LogOutputChannel` (requires VS Code 1.74+ API change) — keep using `appendLine`
  - Do NOT add console.log — all logging through OutputChannel
  - Do NOT modify orchestration-loop.ts to add logging internally

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Touches runtime.ts callbacks and chat handler. Must preserve behavior while adding logging. Cross-cutting concern.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequential after Wave 2)
  - **Parallel Group**: Wave 3 (solo)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 3, 4, 5, 6 (needs all implementations in place to add logging)

  **References**:

  **Pattern References**:
  - `packages/extension/src/runtime.ts` — Existing `log.appendLine(...)` calls (~10 sites). Follow the `"Attractor: "` prefix convention visible in the screenshot and existing code.
  - `packages/extension/src/runtime.ts` — `onStateChange`, `onHandoff`, `onError` callbacks from Task 3's implementation — add logging to each.

  **API/Type References**:
  - `packages/extension/src/application/orchestration-loop.ts` — `OrchestrationStatePayload` shape (what onStateChange receives), `HandoffEnvelope` shape (what onHandoff receives)
  - `packages/extension/src/runtime.ts` — `OutputChannelLike` interface: `{ appendLine(value: string): void }`

  **Test References**:
  - `packages/extension/test/smoke/activation.test.ts` — Shows OutputChannel mock pattern (captured appendLine calls)

  **WHY Each Reference Matters**:
  - Existing log calls: The `"Attractor: "` prefix convention to follow
  - Callback types: Need to know what data is available for logging at each lifecycle point
  - OutputChannel mock: Test pattern for capturing and asserting log output

  **Acceptance Criteria**:
  - [ ] OutputChannel shows orchestration start with run ID and plan ID
  - [ ] OutputChannel shows milestone progress
  - [ ] OutputChannel shows errors with message text
  - [ ] OutputChannel shows orchestration completion with duration
  - [ ] Chat commands log to OutputChannel
  - [ ] `pnpm typecheck && pnpm test --run` passes
  - [ ] Tests assert specific log message patterns

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Full orchestration lifecycle logged
    Tool: Bash
    Preconditions: Mock services, StubModelGateway, captured OutputChannel
    Steps:
      1. Run test that triggers full startOrchestration with 2 milestones
      2. Capture all appendLine calls on the OutputChannel mock
      3. Assert log contains "orchestration started" with run ID
      4. Assert log contains milestone progress messages
      5. Assert log contains "orchestration completed" with duration
    Expected Result: All lifecycle events logged in order
    Failure Indicators: Missing log entries, wrong format, missing data
    Evidence: .sisyphus/evidence/task-7-lifecycle-logging.txt

  Scenario: Error during orchestration logged
    Tool: Bash
    Preconditions: StubModelGateway that throws on second milestone
    Steps:
      1. Run test that triggers orchestration with failing model
      2. Assert log contains "orchestration failed" with error message
      3. Assert error in specific phase is logged
    Expected Result: Error details visible in log
    Failure Indicators: Missing error log, generic error without context
    Evidence: .sisyphus/evidence/task-7-error-logging.txt
  ```

  **Commit**: YES (Commit 5)
  - Message: `feat(runtime): add structured orchestration lifecycle logging`
  - Files: `packages/extension/src/runtime.ts`, `packages/extension/src/chat/attractor-chat-participant.ts`, tests
  - Pre-commit: `pnpm typecheck && pnpm test --run`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**

- [ ] F1. **Plan Compliance Audit** — `oracle`
      Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.
      Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
      Run `pnpm typecheck && pnpm lint && pnpm test --run`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names.
      Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high`
      Start from clean build (`pnpm build`). Run all test suites. Verify: (1) `pnpm typecheck` clean, (2) `pnpm test --run` all green, (3) no regressions in 503 baseline tests. Attempt F5 launch if Extension Development Host available — verify dashboard loads, Output channel shows activation.
      Output: `Typecheck [PASS/FAIL] | Tests [N/N pass] | Baseline [503 preserved?] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
      For each task: read "What to do", read actual changes. Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check FROZEN files are untouched: `orchestration-loop.ts`, `copilot-model-gateway.ts`, `ports.ts`, `bridge.ts`, `packages/shared/**`, `packages/webview/**`. Flag unaccounted changes.
      Output: `Tasks [N/N compliant] | Frozen files [CLEAN/N violations] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Commit | Scope         | Message                                                               | Files                                            | Pre-commit                          |
| ------ | ------------- | --------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------- |
| 1      | Gateway       | `feat(extension): wire CopilotModelGateway at activation`             | extension.ts, test                               | `pnpm typecheck && pnpm test --run` |
| 2      | Chat refactor | `refactor(chat): parameterize buildChatHandler for service injection` | attractor-chat-participant.ts, runtime.ts, tests | `pnpm typecheck && pnpm test --run` |
| 3      | Orchestration | `feat(runtime): implement startOrchestration with OrchestrationLoop`  | runtime.ts, tests                                | `pnpm typecheck && pnpm test --run` |
| 4      | Chat commands | `feat(chat): wire /plan, /run, /status commands`                      | attractor-chat-participant.ts, tests             | `pnpm typecheck && pnpm test --run` |
| 5      | Logging       | `feat(runtime): add structured orchestration lifecycle logging`       | runtime.ts, attractor-chat-participant.ts, tests | `pnpm typecheck && pnpm test --run` |

---

## Success Criteria

### Verification Commands

```bash
pnpm typecheck        # Expected: zero errors
pnpm test --run       # Expected: 503+ tests, 0 failures
pnpm lint             # Expected: zero errors/warnings
```

### Final Checklist

- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent (FROZEN files untouched)
- [ ] All 503+ tests pass
- [ ] Dashboard "Run Plan" triggers real orchestration
- [ ] Chat `/run`, `/plan`, `/status` return real data
- [ ] Output channel shows orchestration lifecycle
