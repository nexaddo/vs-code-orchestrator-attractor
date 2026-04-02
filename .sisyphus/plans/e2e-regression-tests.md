# E2E Regression Test Suite for Attractor VS Code Extension

## TL;DR

> **Summary**: Build a comprehensive Playwright + vitest E2E regression test suite covering the Attractor webview dashboard (4 surfaces), extension-webview bridge messaging, chat participant, orchestration loop, and event sourcing. Wave 1 includes a proof-of-concept spike to validate Playwright can access VS Code's double-nested webview iframes before committing to the approach.
> **Deliverables**: `playwright.config.ts`, VS Code launcher + webview frame helpers, 9 Playwright E2E tests, 16 vitest integration tests, CI job definition, `data-testid` additions to surface components
> **Effort**: Large
> **Parallel**: YES - 9 waves (14 tasks), with Waves 6-8 parallelizable with Waves 2-5
> **Critical Path**: Wave 0 (testids) + Wave 1 (spike/infra) → Wave 2 (handshake) → Wave 3 (surfaces) → Wave 4 (bridge vitest + validation/toasts Playwright) → Wave 5 (store dispatch vitest)

## Context

### Original Request

Build a full suite of E2E tests that regression-test the Attractor VS Code extension from inside VS Code. Use Playwright to control the webview. Cover all happy paths, edge cases, and exceptions.

### Interview Summary

- **Both test layers**: Playwright UI (Waves 0-5) + vitest integration (Waves 6-8)
- **OrchestrationLoop**: Test with mock ModelGateway despite `startOrchestration` being a placeholder
- **data-testid strategy**: Add testids to surface content elements as Wave 0 prep
- **VS Code instance isolation**: Per-file (one instance per test file)
- **Test location**: Playwright E2E tests in root `test/e2e/`; vitest integration tests in `packages/extension/test/integration/` and `packages/webview/test/integration/` (discoverable by existing vitest project entries)

### Metis Review (gaps addressed)

1. **Double-nested iframe** (Gap 1): VS Code webviews are double-nested iframes (`<iframe class="webview">` → inner `<iframe>`). Wave 1 frame finder must account for this.
2. **`timeline.update` is dead code** (Gap 2): Removed from test scope. `graph.update` and `orchestration.state` dispatch to store but NO component renders them — Wave 5 tests store dispatch only, NOT visual rendering.
3. **`run.state` has no bridge trigger** (Gap 3): RunSurface tests must inject synthetic `run.state` messages via postMessage, not via bridge commands.
4. **Degraded mode error not rendered** (Gap 4): `OverviewSurface.tsx` ignores `payload.error`. Wave 0 includes a fix to render degraded-mode errors. Wave 2 tests verify the rendered error.
5. **Toast bar has no `data-testid`** (Gap 5): Wave 0 adds `data-testid="toast-bar"`, `data-testid="toast-{id}"`, `data-testid="toast-dismiss-{id}"`.
6. **Malformed message coverage** (Gap 6): Wave 4 includes tests for messages missing `version`, invalid `type`, and malformed `payload`.
7. **CI job definition** (Gap 7): Wave 1 creates an `e2e` job in `.github/workflows/ci.yml` with Xvfb, matrix (ubuntu+windows), artifact upload for traces.

### Flakiness Mitigations (from Metis)

| Vector                        | Mitigation                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| VS Code launch timing         | `electronApp.firstWindow()` with 30s timeout + explicit `waitForSelector` on activity bar               |
| Webview panel activation      | Wait for outer iframe → inner iframe → `[data-testid]` chain with explicit `waitFor`                    |
| `postMessage` delivery timing | Use web-first assertions (`toBeVisible`, `toHaveText`) which auto-retry — NEVER `page.waitForTimeout()` |
| Double-iframe load race       | Always use `frameLocator` chain with `waitFor` on known element inside innermost frame                  |
| CI display server             | `xvfb-run` on Linux, native on Windows                                                                  |
| Extension activation race     | Wait for extension activation via output channel or command availability before testing                 |
| Temp dir isolation            | `mkdtemp` with unique prefix per test, cleanup in `afterEach`                                           |
| Parallel test interference    | `workers: 1` in Playwright config (serial execution)                                                    |
| CSP blocking                  | All assertions are DOM-based, no JS injection into webview                                              |

## Work Objectives

### Core Objective

Establish a maintainable, deterministic E2E regression test suite that catches regressions in the Attractor webview dashboard, extension-webview bridge, and extension-host integrations before they reach production.

### Deliverables

1. `data-testid` attributes on all surface content elements and toast bar
2. Degraded-mode error rendering fix in `OverviewSurface.tsx`
3. `playwright.config.ts` with VS Code Electron configuration
4. Reusable test utilities: VS Code launcher, webview frame finder
5. 9 Playwright E2E tests covering smoke, handshake, surfaces, bridge validation, and toast rendering
6. 16 vitest integration tests covering bridge commands, store dispatch, chat participant, orchestration loop, event sourcing
7. CI job definition in `.github/workflows/ci.yml`
8. Test fixtures validated against Zod schemas

### Definition of Done (verifiable conditions)

- `npx playwright test` passes all E2E tests (0 failures)
- `pnpm test` passes all vitest tests including new integration tests (0 failures)
- `pnpm typecheck && pnpm lint` pass with 0 errors
- CI `e2e` job passes on both ubuntu-latest and windows-latest
- All Playwright tests complete in <3 minutes total on CI
- Evidence screenshots/traces saved to `.sisyphus/evidence/` on failure

### Must Have

- Proof-of-concept spike validating Playwright webview access (Wave 1, hard blocker)
- Per-file VS Code instance isolation
- All 4 surface rendering tests (overview, repository, plan, run)
- Bridge command flow tests (plan.run, run.cancel, plan.create)
- Toast system regression tests (max-5 enforcement, dismiss, severity)
- Malformed message resilience tests
- Handshake + degraded mode tests
- Chat participant registration test
- OrchestrationLoop integration test with mock ModelGateway

### Must NOT Have (guardrails)

- DO NOT create Playwright tests for graph/orchestration visual rendering (no UI components exist for these)
- DO NOT test `timeline.update` (dead code — no handler in bridge or message-dispatch)
- DO NOT duplicate existing unit test coverage — each vitest integration test must document what it covers that unit tests don't
- DO NOT use `page.waitForTimeout()` or `networkidle` — always use web-first assertions
- DO NOT inject JavaScript into the webview (CSP will block it) — all assertions must be DOM-based
- DO NOT use `workers > 1` in Playwright config (VS Code instances will conflict)
- DO NOT change production behavior except Wave 0 (testids + degraded-mode error fix)
- DO NOT exceed 15 total Playwright tests (per Metis guidance — keep test pyramid balanced; current plan: 9)
- DO NOT mark `run.resume`/`run.retry` tests as passing — mark as `test.fixme()` since behavior will change

## Verification Strategy

> ZERO HUMAN INTERVENTION — all verification is agent-executed.

- Test decision: TDD (RED-GREEN-REFACTOR) for Waves 1-8; Wave 0 is prep work verified by existing tests passing
- QA policy: Every task has agent-executed scenarios with specific selectors and expected outcomes
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`
- Playwright traces: `trace: 'on-first-retry'` captures debugging artifacts automatically

## Execution Strategy

### Parallel Execution Waves

**Wave 0** (Foundation prep — 2 tasks):

- Task 1: Add `data-testid` to surface content elements (`visual-engineering`)
- Task 2: Fix degraded-mode error rendering in OverviewSurface (`quick`)

**Wave 1** (Test infrastructure — 3 tasks):

- Task 3: Proof-of-concept spike — validate Playwright webview access (`deep`)
- Task 4: Playwright config + VS Code launcher + frame finder utilities (`unspecified-high`)
- Task 5: CI job definition for E2E tests (`quick`)

**Wave 2** (Handshake & degraded mode — 1 task):

- Task 6: Handshake flow + degraded mode E2E tests (`unspecified-high`)

**Wave 3** (Surface rendering — 2 tasks):

- Task 7: Overview + Repository surface rendering tests — 2 Playwright tests (`unspecified-high`)
- Task 8: Plan + Run surface rendering tests — 2 Playwright tests (`unspecified-high`)

**Wave 4** (Bridge commands + toast rendering — 2 tasks):

> **Architecture decision**: Bridge command logic (plan.run, run.cancel, plan.create etc.) is tested via **vitest** calling `handleWebviewMessage()` directly — a pure function at `packages/extension/src/dashboard/bridge.ts:48`. This avoids the CSP/trigger mechanism problem: the webview CSP (`default-src 'none'; script-src 'nonce-...'`) blocks JS injection, and no UI buttons exist to trigger these commands. Playwright tests in this wave verify only **toast rendering** by injecting outbound `toast` messages via the message helper (posting to the webview window from Electron page context, not subject to webview CSP).

- Task 9: Bridge command flow integration tests — **vitest** (`unspecified-high`)
- Task 10: Bridge validation + toast rendering E2E tests — 2 Playwright tests (`unspecified-high`)

**Wave 5** (Store dispatch — 1 task):

- Task 11: Graph + orchestration store dispatch verification — vitest (`unspecified-high`)

**Wave 6-8** (Extension-host integration — 3 tasks, parallelizable with Waves 2-5):

- Task 12: Chat participant registration wiring — vitest (`unspecified-high`)
- Task 13: OrchestrationLoop integration with mock ModelGateway — vitest (`unspecified-high`)
- Task 14: Event log + snapshot projector full cycle — vitest (`unspecified-high`)

### Dependency Matrix

| Task                   | Depends On | Blocks         |
| ---------------------- | ---------- | -------------- |
| 1 (testids)            | —          | 6, 7, 8, 10    |
| 2 (error fix)          | —          | 6              |
| 3 (spike)              | —          | 4              |
| 4 (infra)              | 3          | 5, 6, 7, 8, 10 |
| 5 (CI)                 | 4          | —              |
| 6 (handshake)          | 1, 2, 4    | —              |
| 7 (overview+repo)      | 1, 4       | —              |
| 8 (plan+run)           | 1, 4       | —              |
| 9 (bridge cmds vitest) | —          | —              |
| 10 (validation+toasts) | 1, 4       | —              |
| 11 (store dispatch)    | —          | —              |
| 12 (chat)              | —          | —              |
| 13 (orch loop)         | —          | —              |
| 14 (event sourcing)    | —          | —              |

### Agent Dispatch Summary

| Wave      | Tasks           | Categories                    |
| --------- | --------------- | ----------------------------- |
| 0         | 2 (Tasks 1-2)   | visual-engineering, quick     |
| 1         | 3 (Tasks 3-5)   | deep, unspecified-high, quick |
| 2         | 1 (Task 6)      | unspecified-high              |
| 3         | 2 (Tasks 7-8)   | unspecified-high              |
| 4         | 2 (Tasks 9-10)  | unspecified-high              |
| 5         | 1 (Task 11)     | unspecified-high              |
| 6-8       | 3 (Tasks 12-14) | unspecified-high              |
| **Total** | **14 tasks**    |                               |

## TODOs

### Wave 0: Foundation Prep

- [x] 1. Add `data-testid` attributes to surface content elements and toast bar

  **What to do**:
  Add `data-testid` attributes to key content elements inside each surface component and the toast bar. These testids are required by Playwright tests in Waves 2-5. Only add attributes to EXISTING elements — do NOT create new components, change behavior, or refactor.

  Specific additions per file:

  **`packages/webview/src/overview/OverviewSurface.tsx`**:
  - Metrics wrapper `<div>`: `data-testid="overview-metrics"`
  - Each metric `<div key={metric.key}>`: `data-testid={`overview-metric-${metric.key}`}`
  - Repositories grid: `data-testid="overview-grid"`
  - Repositories `<CardContent>`: `data-testid="overview-repos"`
  - Active Runs `<CardContent>`: `data-testid="overview-active-runs"`
  - Recent Failures `<CardContent>`: `data-testid="overview-failures"`

  **`packages/webview/src/repository/RepositorySurface.tsx`**:
  - Root `<div>`: `data-testid="repository-content"`
  - Header `<CardContent>`: `data-testid="repository-header"`
  - Plans `<CardContent>`: `data-testid="repository-plans"`
  - Runs `<CardContent>`: `data-testid="repository-runs"`
  - Activity `<CardContent>`: `data-testid="repository-activity"`

  **`packages/webview/src/plan/PlanSurface.tsx`**:
  - Root `<div>`: `data-testid="plan-content"`
  - Header `<Card>`: `data-testid="plan-header"`
  - Milestones `<CardContent>`: `data-testid="plan-milestones"`
  - Run History `<CardContent>`: `data-testid="plan-history"`
  - Validation Events `<CardContent>`: `data-testid="plan-validation"`

  **`packages/webview/src/run/RunSurface.tsx`**:
  - Root `<div>`: `data-testid="run-content"`
  - Header `<CardContent>`: `data-testid="run-header"`
  - Progress `<CardContent>`: `data-testid="run-progress"`
  - Timeline `<CardContent>`: `data-testid="run-timeline"`
  - Artifacts `<CardContent>`: `data-testid="run-artifacts"`
  - Current Handoff `<Card>`: `data-testid="run-handoff"`

  **`packages/webview/src/app/App.tsx`**:
  - Toast bar container: `data-testid="toast-bar"`
  - Each toast `<div>`: `data-testid={`toast-${toast.id}`}`
  - Each toast dismiss button: `data-testid={`toast-dismiss-${toast.id}`}`

  **Must NOT do**:
  - Don't change element structure, styles, or behavior
  - Don't add new components or wrappers
  - Don't rename existing attributes

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: TSX markup edits across 5 files
  - Skills: [] — No special skills needed for adding data attributes
  - Omitted: [`tailwind-design-system`] — No design system changes

  **Parallelization**: Can Parallel: YES (with Task 2) | Wave 0 | Blocks: 6, 7, 8, 10 | Blocked By: none

  **References**:
  - OverviewSurface: `packages/webview/src/overview/OverviewSurface.tsx` — Metrics at line ~122, grid at ~153, repos at ~158, runs at ~192, failures at ~230
  - RepositorySurface: `packages/webview/src/repository/RepositorySurface.tsx` — Root at ~142, header at ~143, plans at ~162, runs at ~200, activity at ~237
  - PlanSurface: `packages/webview/src/plan/PlanSurface.tsx` — Root at ~224, header at ~226, milestones at ~286, history at ~325, validation at ~363
  - RunSurface: `packages/webview/src/run/RunSurface.tsx` — Root at ~144, header at ~146, progress at ~167, timeline at ~182, artifacts at ~229, handoff at ~261
  - App.tsx: `packages/webview/src/app/App.tsx` — Toast bar rendering section
  - Existing testids: `packages/webview/src/app/SurfaceFrame.tsx` — Already has `data-testid="surface-{name}"` on top-level frames

  **Acceptance Criteria**:
  - [ ] `pnpm typecheck` exits 0
  - [ ] `pnpm lint` exits 0
  - [ ] `pnpm test` exits 0 (no regressions)
  - [ ] Each listed `data-testid` attribute exists in source (grep verification)
  - [ ] No behavior changes — only attribute additions

  **QA Scenarios**:

  ```
  Scenario: All testids present in source
    Tool: Bash
    Steps: Run `grep -r "data-testid" packages/webview/src/ | wc -l` and verify count matches expected
    Expected: All listed testid attributes found in correct files
    Evidence: .sisyphus/evidence/task-1-testids.txt

  Scenario: No regressions in existing tests
    Tool: Bash
    Steps: Run `pnpm test`
    Expected: All existing tests pass (0 failures)
    Evidence: .sisyphus/evidence/task-1-no-regression.txt
  ```

  **Commit**: YES | Message: `test(prep): add data-testid attributes to surface components and toast bar` | Files: `packages/webview/src/overview/OverviewSurface.tsx`, `packages/webview/src/repository/RepositorySurface.tsx`, `packages/webview/src/plan/PlanSurface.tsx`, `packages/webview/src/run/RunSurface.tsx`, `packages/webview/src/app/App.tsx`

---

- [x] 2. Fix degraded-mode error rendering in OverviewSurface

  **What to do**:
  The `OverviewStatePayloadSchema` in `packages/shared/src/contracts/index.ts` includes an optional `error` field, and `packages/extension/src/runtime.ts` sends it when activation degrades. But `packages/webview/src/overview/model.ts` (`projectOverviewState`) strips the error, and `OverviewSurface.tsx` never renders it.

  Fix:
  1. In `packages/webview/src/overview/model.ts`: Add `error` to the projected `OverviewState` type and pass it through from the payload
  2. In `packages/webview/src/overview/OverviewSurface.tsx`: Add an error banner that renders when `state.error` is truthy, using existing design tokens (e.g., `bg-destructive/10 text-destructive` or similar pattern from the codebase). Add `data-testid="overview-error-banner"`.

  **Must NOT do**:
  - Don't change the error payload shape — it already exists in the shared contract
  - Don't add error handling logic to other surfaces
  - Don't change the runtime.ts activation flow

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: Small targeted fix in 2 files
  - Skills: [] — No special skills needed
  - Omitted: [`tailwind-design-system`] — Simple banner, not a design system change

  **Parallelization**: Can Parallel: YES (with Task 1) | Wave 0 | Blocks: 6 | Blocked By: none

  **References**:
  - Shared schema: `packages/shared/src/contracts/index.ts` — `OverviewStatePayloadSchema` with optional `error` field
  - Model projection: `packages/webview/src/overview/model.ts` — `projectOverviewState` function
  - Surface component: `packages/webview/src/overview/OverviewSurface.tsx` — Where to render the banner
  - Runtime degraded payload: `packages/extension/src/runtime.ts` — Sends `overview.state` with `error` when activation fails
  - Existing error pattern: `packages/webview/src/app/App.tsx` — Error boundary rendering for reference

  **Acceptance Criteria**:
  - [ ] `OverviewState` type includes optional `error: string`
  - [ ] `projectOverviewState` passes through `error` from payload
  - [ ] `OverviewSurface.tsx` renders `data-testid="overview-error-banner"` when `state.error` is truthy
  - [ ] Banner not visible when `error` is undefined/null
  - [ ] `pnpm typecheck && pnpm lint && pnpm test` all pass

  **QA Scenarios**:

  ```
  Scenario: Error banner renders with error payload
    Tool: Bash
    Steps: Add a vitest test in packages/webview that renders OverviewSurface with error in payload and checks banner visibility
    Expected: Banner with testid "overview-error-banner" renders with error text
    Evidence: .sisyphus/evidence/task-2-error-banner.txt

  Scenario: No banner without error
    Tool: Bash
    Steps: Render OverviewSurface without error in payload
    Expected: No element with testid "overview-error-banner" in DOM
    Evidence: .sisyphus/evidence/task-2-no-error.txt
  ```

  **Commit**: YES | Message: `fix(webview): render degraded-mode error in OverviewSurface` | Files: `packages/webview/src/overview/OverviewSurface.tsx`, `packages/webview/src/overview/model.ts`

<!-- TASKS_START -->

### Wave 1: Test Infrastructure

- [x] 3. Proof-of-concept spike — validate Playwright can access VS Code webview

  **What to do**:
  Create a disposable spike script (`test/e2e/spike.ts` or similar) that proves 4 things:
  1. Playwright can launch VS Code via `@vscode/test-electron` + `_electron.launch()`
  2. The Attractor dashboard can be opened (via `workbench.action.focusPanel` or activity bar click)
  3. The double-nested webview iframe can be resolved (`iframe.webviewFrame` → inner `iframe`)
  4. DOM inside the webview is readable (find `data-testid="surface-overview"`)

  This is a **hard gate**. If ANY of the 4 fails, stop the plan and escalate. Document findings in `.sisyphus/evidence/e2e-feasibility.md`.

  Also determine: Can `page.evaluate()` inside the Electron page (NOT the webview iframe) call `postMessage()` on the webview panel's message channel? This determines whether the message helper in Task 4 can inject synthetic messages.

  **Must NOT do**:
  - Don't create permanent test infrastructure — this is disposable
  - Don't commit the spike code (evidence file only)

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: Exploratory, failure-prone Electron/VS Code work
  - Skills: [] — No special skills needed
  - Omitted: [`dev-browser`] — This is Electron automation, not browser automation

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 4 | Blocked By: none

  **References**:
  - `@vscode/test-electron` docs: https://github.com/microsoft/vscode-test — Download + launch API
  - Playwright Electron: https://playwright.dev/docs/api/class-electron — `_electron.launch()` API
  - Webview HTML with CSP: `packages/extension/src/dashboard/webview-html.ts` — CSP nonce pattern
  - Webview provider: `packages/extension/src/dashboard/webview-provider.ts` — Panel creation
  - Existing surface testid: `packages/webview/src/app/SurfaceFrame.tsx` — `data-testid="surface-overview"` already exists
  - Runtime activation: `packages/extension/src/runtime.ts` — `activate()` registers commands and opens dashboard

  **Acceptance Criteria**:
  - [ ] `.sisyphus/evidence/e2e-feasibility.md` exists with findings for all 4 checks
  - [ ] If all 4 pass: document the exact launch args, dashboard-open method, and frame path
  - [ ] If any fail: document the failure and recommended alternative approach
  - [ ] Message injection feasibility documented (yes/no with details)

  **QA Scenarios**:

  ```
  Scenario: Spike successfully reads webview DOM
    Tool: Bash
    Steps: Run the spike script
    Expected: Script outputs "surface-overview found" and writes evidence file
    Evidence: .sisyphus/evidence/e2e-feasibility.md

  Scenario: Spike fails gracefully
    Tool: Bash
    Steps: Run the spike script in an environment where VS Code can't launch
    Expected: Clear error message identifying which of the 4 checks failed
    Evidence: .sisyphus/evidence/e2e-feasibility-failure.md
  ```

  **Commit**: NO (spike only — replaced by Task 4)

---

- [ ] 4. Playwright config + VS Code launcher + frame finder utilities + smoke test

  **What to do**:
  Using findings from Task 3, create permanent test infrastructure:
  1. **`playwright.config.ts`** (root):

     ```typescript
     import { defineConfig } from "@playwright/test";
     export default defineConfig({
       testDir: "test/e2e",
       timeout: 60_000,
       retries: process.env.CI ? 1 : 0,
       workers: 1,
       use: { trace: "on-first-retry" }
     });
     ```

  2. **`test/e2e/helpers/launch.ts`**:
     - `launchVSCode()`: Downloads VS Code (if needed), launches via `_electron.launch()`, returns `{ electronApp, page }`
     - `openAttractorPanel(page)`: Opens the Attractor dashboard using the method proven in Task 3
     - `closeVSCode(electronApp)`: Clean shutdown

  3. **`test/e2e/helpers/webview-frame.ts`**:
     - `getWebviewFrame(page)`: Resolves the double-nested iframe chain, returns the innermost `FrameLocator`
     - Should use the exact frame path discovered in Task 3

  4. **`test/e2e/helpers/messages.ts`** (if Task 3 proved message injection feasible):
     - `postMessageToWebview(page, message)`: Sends a typed message to the webview via `page.evaluate()` on the Electron page context
     - Messages must conform to `WebviewMessageSchema` from `packages/shared/src/contracts/index.ts`

  5. **`test/e2e/smoke.test.ts`** — 1 Playwright test:
     - Launch VS Code, open Attractor, find `surface-overview` in webview frame
     - This is the permanent "canary" test

  6. **`package.json`** updates:
     - Add `@playwright/test` and `@vscode/test-electron` as devDependencies
     - Add `"test:e2e": "playwright test"` script

  **Must NOT do**:
  - Don't use `page.waitForTimeout()`
  - Don't hardcode VS Code paths — use `@vscode/test-electron` download
  - Don't set `workers > 1`

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: Multi-file infrastructure work with Electron complexity
  - Skills: [] — No special skills needed
  - Omitted: [] — N/A

  **Parallelization**: Can Parallel: NO (depends on Task 3) | Wave 1 | Blocks: 5, 6, 7, 8, 10 | Blocked By: 3

  **References**:
  - Spike evidence: `.sisyphus/evidence/e2e-feasibility.md` — Task 3 findings (MUST READ FIRST)
  - Shared contracts: `packages/shared/src/contracts/index.ts` — `WebviewMessageSchema` and all payload schemas
  - CSP config: `packages/extension/src/dashboard/webview-html.ts` — Understand what's blocked
  - Existing package.json: `package.json` — Current devDependencies and scripts
  - SurfaceFrame testid: `packages/webview/src/app/SurfaceFrame.tsx` — `data-testid="surface-overview"` target for smoke test

  **Acceptance Criteria**:
  - [ ] `playwright.config.ts` exists at root with `workers: 1`, `trace: 'on-first-retry'`
  - [ ] `test/e2e/helpers/launch.ts` exports `launchVSCode`, `openAttractorPanel`, `closeVSCode`
  - [ ] `test/e2e/helpers/webview-frame.ts` exports `getWebviewFrame`
  - [ ] `test/e2e/helpers/messages.ts` exists if message injection was proven feasible
  - [ ] `test/e2e/smoke.test.ts` contains exactly 1 Playwright test
  - [ ] `npx playwright test test/e2e/smoke.test.ts` passes
  - [ ] No `page.waitForTimeout()` in any file

  **QA Scenarios**:

  ```
  Scenario: Smoke test passes
    Tool: Bash
    Steps: Run `npx playwright test test/e2e/smoke.test.ts`
    Expected: 1 test passed, 0 failed
    Evidence: .sisyphus/evidence/task-4-smoke.txt

  Scenario: Smoke test produces trace on retry
    Tool: Bash
    Steps: Run `npx playwright test test/e2e/smoke.test.ts --retries=1` (force retry)
    Expected: Trace file generated in test-results/
    Evidence: .sisyphus/evidence/task-4-trace.txt
  ```

  **Commit**: YES | Message: `test(e2e): add playwright config, VS Code launcher, and frame finder utilities` | Files: `playwright.config.ts`, `test/e2e/helpers/launch.ts`, `test/e2e/helpers/webview-frame.ts`, `test/e2e/helpers/messages.ts`, `test/e2e/smoke.test.ts`, `package.json`

---

- [ ] 5. CI job definition for E2E tests

  **What to do**:
  Add an `e2e` job to `.github/workflows/ci.yml` that runs the Playwright E2E suite.

  Job configuration:
  - **Trigger**: Same as existing jobs (push/PR)
  - **Matrix**: `os: [ubuntu-latest, windows-latest]`
  - **Steps**:
    1. Checkout
    2. Setup Node (match existing job)
    3. `pnpm install`
    4. `pnpm build` (extension must be built for VS Code to load it)
    5. Install Playwright Chromium: `npx playwright install chromium --with-deps`
    6. Run tests: `xvfb-run npx playwright test` (Linux) or `npx playwright test` (Windows)
    7. Upload artifacts on failure: `playwright-report/`, `test-results/`
  - **Needs**: Run after `fast-checks` job passes

  **Must NOT do**:
  - Don't modify existing `fast-checks` or `package-check` jobs
  - Don't add macOS to the matrix (not needed initially)

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: Single-file YAML edit
  - Skills: [] — No special skills needed
  - Omitted: [] — N/A

  **Parallelization**: Can Parallel: NO (depends on Task 4 for correct script name) | Wave 1 | Blocks: none | Blocked By: 4

  **References**:
  - Existing CI: `.github/workflows/ci.yml` — Current job structure to follow
  - Playwright CI docs: https://playwright.dev/docs/ci — CI setup recommendations
  - Package scripts: `package.json` — `test:e2e` script from Task 4

  **Acceptance Criteria**:
  - [ ] `.github/workflows/ci.yml` has an `e2e` job
  - [ ] Job runs on `ubuntu-latest` and `windows-latest`
  - [ ] Job uses `xvfb-run` on Linux
  - [ ] Job uploads `playwright-report/` and `test-results/` on failure
  - [ ] Job depends on `fast-checks`
  - [ ] `pnpm lint` passes (YAML valid)

  **QA Scenarios**:

  ```
  Scenario: CI YAML is valid
    Tool: Bash
    Steps: Run `npx yaml-lint .github/workflows/ci.yml` or equivalent YAML validator
    Expected: No syntax errors
    Evidence: .sisyphus/evidence/task-5-yaml-valid.txt

  Scenario: E2E job structure correct
    Tool: Bash
    Steps: Grep for `e2e` job name, `xvfb-run`, `playwright install`, `upload-artifact` in the workflow file
    Expected: All expected elements present
    Evidence: .sisyphus/evidence/task-5-job-structure.txt
  ```

  **Commit**: YES | Message: `ci: add e2e job with Xvfb and trace artifacts` | Files: `.github/workflows/ci.yml`

### Wave 2: Handshake & Degraded Mode

- [ ] 6. Handshake flow + degraded mode E2E tests (Playwright — 2 tests)

  **What to do**:
  Create `test/e2e/handshake.test.ts` with 2 Playwright tests verifying the extension-webview handshake.

  **Test 1: `test('handshake: webview receives overview.state after ready')`**:
  - Launch VS Code, open Attractor panel
  - Navigate to webview frame
  - Assert `data-testid="surface-overview"` is visible (proves handshake completed: webview sent "ready", extension replied with "overview.state")
  - Assert `data-testid="overview-metrics"` is visible (proves overview payload was processed)

  **Test 2: `test('handshake: degraded mode shows error banner')`**:
  - Launch VS Code in a workspace with intentionally broken storage (e.g., read-only temp dir)
  - Open Attractor panel, navigate to webview frame
  - Assert `data-testid="overview-error-banner"` is visible (from Task 2 fix)
  - Assert banner text contains error message

  **Must NOT do**:
  - Don't test bridge commands in this file
  - Don't use `page.waitForTimeout()` — use `toBeVisible()` auto-retry

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: Playwright E2E with VS Code lifecycle complexity
  - Skills: [] — No special skills needed
  - Omitted: [] — N/A

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: none | Blocked By: 1, 2, 4

  **References**:
  - Launch helper: `test/e2e/helpers/launch.ts` — From Task 4
  - Frame finder: `test/e2e/helpers/webview-frame.ts` — From Task 4
  - Webview boot sequence: `packages/webview/src/index.ts` — Sends "ready" message on load
  - Bridge ready handler: `packages/extension/src/dashboard/bridge.ts:48-66` — Responds to "ready" with `overview.state`
  - Overview testids: Task 1 — `overview-metrics`, `overview-error-banner`
  - Degraded payload: `packages/extension/src/runtime.ts` — Sends overview with `error` when storage init fails

  **Acceptance Criteria**:
  - [ ] `test/e2e/handshake.test.ts` contains exactly 2 Playwright tests
  - [ ] `npx playwright test test/e2e/handshake.test.ts` passes
  - [ ] No `page.waitForTimeout()` calls
  - [ ] Test 2 verifies error banner visibility and text content

  **QA Scenarios**:

  ```
  Scenario: Normal handshake completes
    Tool: Bash
    Steps: Run `npx playwright test test/e2e/handshake.test.ts -g "handshake: webview receives"`
    Expected: Test passes, overview metrics visible within timeout
    Evidence: .sisyphus/evidence/task-6-handshake.txt

  Scenario: Degraded mode renders error
    Tool: Bash
    Steps: Run `npx playwright test test/e2e/handshake.test.ts -g "degraded mode"`
    Expected: Test passes, error banner visible with message text
    Evidence: .sisyphus/evidence/task-6-degraded.txt
  ```

  **Commit**: YES | Message: `test(e2e): handshake flow and degraded mode` | Files: `test/e2e/handshake.test.ts`

### Wave 3: Surface Rendering

- [ ] 7. Overview + Repository surface rendering tests (Playwright — 2 tests)

  **What to do**:
  Create `test/e2e/surfaces-overview-repository.test.ts` with 2 Playwright tests.

  **Test 1: `test('overview: populated state renders metrics, repos, runs, failures')`**:
  - Launch VS Code, open Attractor, get webview frame
  - Inject a populated `overview.state` message via the message helper (if available) or wait for natural boot
  - Assert:
    - `data-testid="overview-metrics"` is visible
    - At least 1 metric element `[data-testid^="overview-metric-"]` exists
    - `data-testid="overview-repos"` is visible
    - `data-testid="overview-active-runs"` is visible
    - `data-testid="overview-failures"` is visible

  **Test 2: `test('repository: populated state renders header, plans, runs, activity')`**:
  - Inject `repository.state` message with a populated repository payload
  - Assert:
    - `data-testid="repository-content"` is visible
    - `data-testid="repository-header"` is visible
    - `data-testid="repository-plans"` is visible
    - `data-testid="repository-runs"` is visible

  Fixture data must validate against `OverviewStatePayloadSchema` and `RepositoryStatePayloadSchema`.

  **Must NOT do**:
  - Don't test empty states in this task (those are naturally tested by handshake)
  - Don't hardcode fixture data that doesn't match Zod schemas

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: Playwright E2E with fixture management
  - Skills: [] — No special skills needed
  - Omitted: [] — N/A

  **Parallelization**: Can Parallel: YES (with Task 8) | Wave 3 | Blocks: none | Blocked By: 1, 4

  **References**:
  - Overview testids: Task 1 additions in `OverviewSurface.tsx`
  - Repository testids: Task 1 additions in `RepositorySurface.tsx`
  - Overview schema: `packages/shared/src/contracts/index.ts` — `OverviewStatePayloadSchema`
  - Repository schema: `packages/shared/src/contracts/index.ts` — `RepositoryStatePayloadSchema`
  - Message helper: `test/e2e/helpers/messages.ts` — From Task 4

  **Acceptance Criteria**:
  - [ ] `test/e2e/surfaces-overview-repository.test.ts` contains exactly 2 Playwright tests
  - [ ] Fixture data validates against Zod schemas (add schema validation in test setup)
  - [ ] `npx playwright test test/e2e/surfaces-overview-repository.test.ts` passes
  - [ ] No `page.waitForTimeout()` calls
  - [ ] Fixtures stored in `test/e2e/fixtures/`

  **QA Scenarios**:

  ```
  Scenario: Overview populated rendering
    Tool: Bash
    Steps: Run `npx playwright test test/e2e/surfaces-overview-repository.test.ts -g "overview: populated"`
    Expected: All overview testids visible
    Evidence: .sisyphus/evidence/task-7-overview.txt

  Scenario: Repository populated rendering
    Tool: Bash
    Steps: Run `npx playwright test test/e2e/surfaces-overview-repository.test.ts -g "repository: populated"`
    Expected: All repository testids visible
    Evidence: .sisyphus/evidence/task-7-repository.txt
  ```

  **Commit**: YES | Message: `test(e2e): overview and repository surface rendering` | Files: `test/e2e/surfaces-overview-repository.test.ts`, `test/e2e/fixtures/overview-populated.json`, `test/e2e/fixtures/repository-populated.json`

---

- [ ] 8. Plan + Run surface rendering tests (Playwright — 2 tests)

  **What to do**:
  Create `test/e2e/surfaces-plan-run.test.ts` with 2 Playwright tests.

  **Test 1: `test('plan: populated state renders header, milestones, history')`**:
  - Inject `plan.state` message with populated plan payload
  - Assert:
    - `data-testid="plan-content"` is visible
    - `data-testid="plan-header"` is visible
    - `data-testid="plan-milestones"` is visible
    - `data-testid="plan-history"` is visible

  **Test 2: `test('run: populated state renders header, progress, timeline, artifacts')`**:
  - Inject `run.state` message with populated run payload (NOTE: `run.state` has no bridge trigger — must inject via postMessage)
  - Assert:
    - `data-testid="run-content"` is visible
    - `data-testid="run-header"` is visible
    - `data-testid="run-progress"` is visible
    - `data-testid="run-timeline"` is visible

  Fixture data must validate against `PlanStatePayloadSchema` and `RunStatePayloadSchema`.

  **Must NOT do**:
  - Don't test bridge commands that trigger plan/run state changes (that's Task 9)
  - Don't test `run.resume`/`run.retry` behavior

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: Playwright E2E with fixture management
  - Skills: [] — No special skills needed
  - Omitted: [] — N/A

  **Parallelization**: Can Parallel: YES (with Task 7) | Wave 3 | Blocks: none | Blocked By: 1, 4

  **References**:
  - Plan testids: Task 1 additions in `PlanSurface.tsx`
  - Run testids: Task 1 additions in `RunSurface.tsx`
  - Plan schema: `packages/shared/src/contracts/index.ts` — `PlanStatePayloadSchema`
  - Run schema: `packages/shared/src/contracts/index.ts` — `RunStatePayloadSchema`
  - Message helper: `test/e2e/helpers/messages.ts` — From Task 4
  - Run surface note: `packages/webview/src/run/RunSurface.tsx` — Uses `run.state` payload, no bridge trigger exists

  **Acceptance Criteria**:
  - [ ] `test/e2e/surfaces-plan-run.test.ts` contains exactly 2 Playwright tests
  - [ ] Fixture data validates against Zod schemas
  - [ ] `npx playwright test test/e2e/surfaces-plan-run.test.ts` passes
  - [ ] No `page.waitForTimeout()` calls
  - [ ] Fixtures stored in `test/e2e/fixtures/`

  **QA Scenarios**:

  ```
  Scenario: Plan populated rendering
    Tool: Bash
    Steps: Run `npx playwright test test/e2e/surfaces-plan-run.test.ts -g "plan: populated"`
    Expected: All plan testids visible
    Evidence: .sisyphus/evidence/task-8-plan.txt

  Scenario: Run populated rendering
    Tool: Bash
    Steps: Run `npx playwright test test/e2e/surfaces-plan-run.test.ts -g "run: populated"`
    Expected: All run testids visible
    Evidence: .sisyphus/evidence/task-8-run.txt
  ```

  **Commit**: YES | Message: `test(e2e): plan and run surface rendering` | Files: `test/e2e/surfaces-plan-run.test.ts`, `test/e2e/fixtures/plan-populated.json`, `test/e2e/fixtures/run-populated.json`

### Wave 4: Bridge Commands + Toast Rendering

- [x] 9. Bridge command flow integration tests (vitest — 5 tests)

  **What to do**:
  Create `packages/extension/test/integration/bridge-commands.test.ts` (vitest) testing the bridge command handler logic. This tests `handleWebviewMessage()` directly — a pure function that takes a parsed message, services, panel mock, and optional orchestration context. **This replaces the original Playwright approach** because the webview CSP blocks JS injection and no UI buttons trigger these commands.

  **Tests** (5 tests):
  1. `test('plan.run: valid planId sends orchestration-started toast')`:
     - Create mock `StorageServices`, mock `WebviewPanelLike` that records `postMessage` calls
     - Call `handleWebviewMessage({ version: 1, requestId: "r1", type: "plan.run", payload: { planId: "plan-001" } }, services, panel)`
     - Assert `panel.postMessage` was called with `{ type: "toast", payload: { message: "Orchestration started for plan plan-001", severity: "info" } }`

  2. `test('plan.run: empty planId sends validation warning toast')`:
     - Call `handleWebviewMessage({ version: 1, requestId: "r2", type: "plan.run", payload: { planId: "" } }, services, panel)`
     - Assert `panel.postMessage` was called with `{ type: "toast", payload: { severity: "warning" } }` containing validation message

  3. `test('run.cancel: valid runId sends cancellation toast')`:
     - Call `handleWebviewMessage({ version: 1, requestId: "r3", type: "run.cancel", payload: { runId: "run-001" } }, services, panel)`
     - Assert `panel.postMessage` called with `{ type: "toast", payload: { message: "Cancellation requested for run run-001", severity: "info" } }`

  4. `test('plan.create: sends acknowledgment toast')`:
     - Call `handleWebviewMessage({ version: 1, requestId: "r4", type: "plan.create", payload: {} }, services, panel)`
     - Assert `panel.postMessage` called with acknowledgment toast

  5. `test('run.resume and run.retry: send not-yet-supported warning')`:
     - Call with `type: "run.resume"` → assert toast with severity `"warning"` containing "not yet supported"
     - Call with `type: "run.retry"` → assert toast with severity `"warning"` containing "not yet supported"
     - Comment: `// This tests the unsupported command path which is NOT covered by existing bridge.test.ts`

  **Must NOT do**:
  - Don't create Playwright tests for bridge commands (CSP blocks injection, no UI triggers exist)
  - Don't duplicate existing unit tests in `packages/extension/test/dashboard/bridge.test.ts` — check existing coverage first and skip any overlapping tests
  - Don't test query routes (ready, repository.open, milestone.open, graph.focus) — those are already tested

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: Integration tests requiring bridge function + mock setup
  - Skills: [] — No special skills needed
  - Omitted: [] — N/A

  **Parallelization**: Can Parallel: YES (with Task 10, and with Waves 6-8) | Wave 4 | Blocks: none | Blocked By: none

  **References**:
  - Bridge function: `packages/extension/src/dashboard/bridge.ts:48` — `handleWebviewMessage` entry point
  - WebviewPanelLike interface: `packages/extension/src/dashboard/bridge.ts:15` — Mock target
  - BridgeOrchestrationContext: `packages/extension/src/dashboard/bridge.ts:23` — Optional orchestration arg
  - plan.run handler: `packages/extension/src/dashboard/bridge.ts:126-189` — Validates planId, starts orchestration, sends toast
  - run.cancel handler: `packages/extension/src/dashboard/bridge.ts:191-221` — Validates runId, cancels, sends toast
  - plan.create handler: `packages/extension/src/dashboard/bridge.ts:111-123` — Sends acknowledgment toast
  - run.resume/retry: `packages/extension/src/dashboard/bridge.ts:223-236` — "not yet supported" warning
  - Existing bridge tests: `packages/extension/test/dashboard/bridge.test.ts` — Check for overlap before writing
  - Mock pattern: `packages/extension/test/smoke/activation.test.ts` — Mock `StorageServicesLike`

  **Acceptance Criteria**:
  - [ ] `pnpm test` exits 0 including these new tests
  - [ ] Each test verifies exact toast message text (matching `bridge.ts` strings exactly)
  - [ ] Each test verifies toast severity (`info` or `warning`)
  - [ ] No overlap with existing `bridge.test.ts` tests (add comments documenting what's new)
  - [ ] No Playwright imports — this is a vitest test

  **QA Scenarios**:

  ```
  Scenario: plan.run valid sends correct toast
    Tool: Bash
    Steps: Run `pnpm test -- --grep "plan.run: valid planId"`
    Expected: Test passes, panel.postMessage called with exact orchestration-started toast
    Evidence: .sisyphus/evidence/task-9-plan-run-valid.txt

  Scenario: plan.run invalid sends validation warning
    Tool: Bash
    Steps: Run `pnpm test -- --grep "plan.run: empty planId"`
    Expected: Test passes, panel.postMessage called with validation warning toast
    Evidence: .sisyphus/evidence/task-9-plan-run-invalid.txt
  ```

  **Commit**: YES | Message: `test(integration): bridge command flows via handleWebviewMessage` | Files: `packages/extension/test/integration/bridge-commands.test.ts`

---

- [ ] 10. Bridge validation + toast rendering E2E tests (Playwright — 2 tests)

  **What to do**:
  Create `test/e2e/bridge-validation-and-toasts.test.ts` combining bridge validation (malformed messages) with toast rendering verification. This is the Playwright counterpart that tests what the user actually SEES — toast DOM elements rendering correctly.

  **Test 1: `test('bridge: malformed messages do not crash the webview')`**:
  - Launch VS Code, open Attractor, get webview frame
  - Inject 3 malformed messages via the message helper:
    1. Missing `version` field: `{ type: "overview.state", payload: {} }`
    2. Unknown type: `{ version: 1, type: "nonexistent.type", payload: {} }`
    3. Invalid payload: `{ version: 1, type: "overview.state", payload: "not-an-object" }`
  - After each, assert `data-testid="surface-overview"` is still visible (webview didn't crash)
  - If the bridge sends error toasts for malformed messages, assert those are visible

  **Test 2: `test('toast: max-5 FIFO, severity rendering, dismiss')`**:
  - Inject 6 toast messages via the message helper (each with unique id and varying severity)
  - Assert only 5 toasts are visible (max-5 FIFO enforcement from `packages/webview/src/app/store.ts`)
  - Assert the first toast was evicted
  - Click dismiss on one toast using `data-testid="toast-dismiss-{id}"`
  - Assert that toast disappears
  - Assert severity classes/colors are correct (check for severity-specific CSS classes or text)

  **Must NOT do**:
  - Don't test bridge command logic (that's Task 9 vitest)
  - Don't use `page.waitForTimeout()` — use `toBeVisible` / `toBeHidden` auto-retry

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: Playwright E2E with message injection and DOM assertions
  - Skills: [] — No special skills needed
  - Omitted: [] — N/A

  **Parallelization**: Can Parallel: YES (with Task 9) | Wave 4 | Blocks: none | Blocked By: 1, 4

  **References**:
  - Message helper: `test/e2e/helpers/messages.ts` — From Task 4
  - Toast bar testids: Task 1 — `toast-bar`, `toast-{id}`, `toast-dismiss-{id}`
  - Store toast logic: `packages/webview/src/app/store.ts` — `appReducer` SHOW_TOAST/DISMISS_TOAST actions, max 5 FIFO
  - Toast rendering: `packages/webview/src/app/App.tsx` — Toast bar JSX
  - ToastItem type: `packages/webview/src/app/store.ts:40` — `id`, `message`, `severity`, `actions`
  - Bridge malformed handling: `packages/extension/src/dashboard/bridge.ts:48` — Entry point handles version/type checks

  **Acceptance Criteria**:
  - [ ] `test/e2e/bridge-validation-and-toasts.test.ts` contains exactly 2 Playwright tests
  - [ ] `npx playwright test test/e2e/bridge-validation-and-toasts.test.ts` passes
  - [ ] Malformed message test proves webview survives all 3 bad message types
  - [ ] Toast test proves max-5 FIFO, dismiss click, and severity rendering
  - [ ] No `page.waitForTimeout()` calls

  **QA Scenarios**:

  ```
  Scenario: Malformed messages don't crash webview
    Tool: Bash
    Steps: Run `npx playwright test test/e2e/bridge-validation-and-toasts.test.ts -g "malformed"`
    Expected: Test passes, webview remains functional after all malformed messages
    Evidence: .sisyphus/evidence/task-10-malformed.txt

  Scenario: Toast FIFO and dismiss
    Tool: Bash
    Steps: Run `npx playwright test test/e2e/bridge-validation-and-toasts.test.ts -g "toast"`
    Expected: Test passes, max-5 enforced, dismiss works, severity visible
    Evidence: .sisyphus/evidence/task-10-toasts.txt
  ```

  **Commit**: YES | Message: `test(e2e): bridge validation resilience and toast rendering` | Files: `test/e2e/bridge-validation-and-toasts.test.ts`

### Wave 5: Store Dispatch

- [x] 11. Graph + orchestration store dispatch verification (vitest — 3 tests)

  **What to do**:
  Create `packages/webview/test/integration/store-dispatch.test.ts` testing that `graph.update` and `orchestration.state` messages are correctly dispatched through `messageDispatch` into the store. These messages dispatch to store but NO component renders them — so this is a store-level integration test, not a UI test.

  **Tests** (3 tests):
  1. `test('graph.update: dispatches graphUpdate to store')`:
     - Create a store via `createStore(createInitialState())`
     - Call `messageDispatch(store, { version: 1, type: "graph.update", payload: { nodeId: "n1", status: "complete" } })`
     - Assert `store.getState().graphUpdate` equals `{ nodeId: "n1", status: "complete" }`
     - Comment: `// This tests the full dispatch chain which IS covered by message-dispatch.test.ts but NOT the store integration`

  2. `test('orchestration.state: dispatches orchestration to store')`:
     - Call `messageDispatch(store, { version: 1, type: "orchestration.state", payload: { runId: "r1", milestoneIndex: 0, milestoneCount: 3, milestoneName: "Setup", phases: [] } })`
     - Assert `store.getState().orchestration` has the correct shape

  3. `test('graph.update + orchestration.state: both coexist in store')`:
     - Dispatch both message types sequentially
     - Assert both `graphUpdate` and `orchestration` are populated simultaneously

  **Must NOT do**:
  - Don't create Playwright tests (no UI components render these)
  - Don't test `timeline.update` (dead code)
  - Don't duplicate `packages/webview/test/app/message-dispatch.test.ts` dispatch logic — focus on store state integration

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: Integration test requiring store + dispatch chain
  - Skills: [] — No special skills needed
  - Omitted: [] — N/A

  **Parallelization**: Can Parallel: YES (no dependencies) | Wave 5 | Blocks: none | Blocked By: none

  **References**:
  - Store: `packages/webview/src/app/store.ts` — `createStore`, `createInitialState`, `appReducer` with `graphUpdate` at line 145 and `orchestration` at line 154
  - Message dispatch: `packages/webview/src/app/message-dispatch.ts` — `messageDispatch` function routing messages to store
  - GraphUpdateItem type: `packages/webview/src/app/store.ts:47` — `{ nodeId, status }`
  - OrchestrationStateItem type: `packages/webview/src/app/store.ts:65` — `{ runId, milestoneIndex, milestoneCount, milestoneName, phases }`
  - Existing dispatch tests: `packages/webview/test/app/message-dispatch.test.ts` — Tests dispatch routing; this task tests store STATE

  **Acceptance Criteria**:
  - [ ] `pnpm test` exits 0 including these new tests
  - [ ] Each test has a `// This tests [X] which is NOT covered by [existing test file]` comment
  - [ ] Tests use `createStore`/`createInitialState` imports from `packages/webview/src/app/store.ts`
  - [ ] No Playwright imports — this is a vitest test
  - [ ] No tests for `timeline.update` (dead code)

  **QA Scenarios**:

  ```
  Scenario: graph.update dispatches to store
    Tool: Bash
    Steps: Run `pnpm test -- --grep "graph.update: dispatches"`
    Expected: Test passes, store.graphUpdate matches dispatched payload
    Evidence: .sisyphus/evidence/task-11-graph.txt

  Scenario: Both graph + orchestration coexist
    Tool: Bash
    Steps: Run `pnpm test -- --grep "both coexist"`
    Expected: Test passes, both store fields populated
    Evidence: .sisyphus/evidence/task-11-coexist.txt
  ```

  **Commit**: YES | Message: `test(integration): graph and orchestration store dispatch` | Files: `packages/webview/test/integration/store-dispatch.test.ts`

### Wave 6-8: Extension-Host Integration (parallelizable with Waves 2-5)

- [x] 12. Chat participant registration wiring (vitest — 2 tests)

  **What to do**:
  Create `packages/extension/test/integration/chat-participant.test.ts` testing chat participant registration via the extension activation path.

  **Tests** (2 tests):
  1. `test('chat participant registers with correct ID')`:
     - Import and call the relevant registration logic
     - Assert the participant was registered with ID `"attractor.attractor"` (matching `PARTICIPANT_ID` constant at `packages/extension/src/chat/attractor-chat-participant.ts:41`)
     - Use mock `vscode.chat.createChatParticipant` if needed

  2. `test('chat participant has followup provider')`:
     - Verify that the created participant has a `followupProvider` assigned
     - This catches regressions where the followup provider wiring is accidentally removed

  **Must NOT do**:
  - Don't test the chat handler's response logic (that requires live Copilot LM access)
  - Don't duplicate `packages/extension/test/smoke/activation.test.ts` — focus on registration wiring details not tested there

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: VS Code API mocking + registration verification
  - Skills: [] — No special skills needed
  - Omitted: [] — N/A

  **Parallelization**: Can Parallel: YES (no dependencies, parallelizable with Waves 2-5) | Wave 6 | Blocks: none | Blocked By: none

  **References**:
  - Chat participant: `packages/extension/src/chat/attractor-chat-participant.ts` — `PARTICIPANT_ID = "attractor.attractor"` at line 41, `registerChatParticipant` function
  - Existing activation tests: `packages/extension/test/smoke/activation.test.ts` — Tests that participant creation is called, but NOT the ID or followup provider
  - VS Code mock patterns: `packages/extension/test/smoke/activation.test.ts` — Mock `vscode` module patterns

  **Acceptance Criteria**:
  - [ ] `pnpm test` exits 0 including these new tests
  - [ ] Test verifies participant ID is exactly `"attractor.attractor"`
  - [ ] Test verifies `followupProvider` is assigned
  - [ ] Each test has a comment explaining what it covers that existing tests don't
  - [ ] No live Copilot API calls

  **QA Scenarios**:

  ```
  Scenario: Participant ID matches constant
    Tool: Bash
    Steps: Run `pnpm test -- --grep "registers with correct ID"`
    Expected: Test passes, ID verified as "attractor.attractor"
    Evidence: .sisyphus/evidence/task-12-participant-id.txt

  Scenario: Followup provider wired
    Tool: Bash
    Steps: Run `pnpm test -- --grep "followup provider"`
    Expected: Test passes, followupProvider is not null/undefined
    Evidence: .sisyphus/evidence/task-12-followup.txt
  ```

  **Commit**: YES | Message: `test(integration): chat participant registration wiring` | Files: `packages/extension/test/integration/chat-participant.test.ts`

---

- [x] 13. OrchestrationLoop integration with mock ModelGateway (vitest — 3 tests)

  **What to do**:
  Create `packages/extension/test/integration/orchestration-loop.test.ts` testing the `OrchestrationLoop` class with a mock `ModelGateway`.

  **Tests** (3 tests):
  1. `test('orchestration loop: starts and progresses through phases')`:
     - Create `OrchestrationLoop` with `NoOpModelGateway` (from `packages/extension/src/application/ports.ts`)
     - Start a plan run with a simple DOT graph
     - Assert the loop progresses through expected phases
     - Note: `startOrchestration` in `runtime.ts` is a NO-OP placeholder, but the loop class itself is functional

  2. `test('orchestration loop: emits events to event log')`:
     - Provide a mock or real `FileEventLog` (use `mkdtemp` pattern)
     - Run the orchestration loop
     - Assert events were appended to the log

  3. `test('orchestration loop: cancellation stops the loop')`:
     - Start the loop, then cancel it
     - Assert the loop stopped and emitted a cancellation event

  **Must NOT do**:
  - Don't test with real Copilot API (use `NoOpModelGateway`)
  - Don't test `startOrchestration` in runtime.ts (it's a NO-OP)
  - Don't duplicate `packages/extension/test/application/orchestration-loop.test.ts` — focus on integration with event log

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: Multi-service integration test
  - Skills: [] — No special skills needed
  - Omitted: [] — N/A

  **Parallelization**: Can Parallel: YES (no dependencies, parallelizable with Waves 2-5) | Wave 7 | Blocks: none | Blocked By: none

  **References**:
  - OrchestrationLoop: `packages/extension/src/application/orchestration-loop.ts` — Main class
  - NoOpModelGateway: `packages/extension/src/application/ports.ts` — `NoOpModelGateway` class for testing
  - ModelGateway interface: `packages/extension/src/application/ports.ts` — `ModelGateway` interface
  - FileEventLog: `packages/extension/src/storage/events/file-event-log.ts` — Event logging
  - Existing loop tests: `packages/extension/test/application/orchestration-loop.test.ts` — Tests the loop in isolation; this task tests integration with event log
  - mkdtemp pattern: `packages/extension/test/storage/events/file-event-log.test.ts` — Temp dir pattern for tests

  **Acceptance Criteria**:
  - [ ] `pnpm test` exits 0 including these new tests
  - [ ] Each test has a `// This tests [X] which is NOT covered by [existing test file]` comment
  - [ ] Uses `NoOpModelGateway` — no real Copilot calls
  - [ ] Each test creates a unique temp directory and cleans up in `afterEach`
  - [ ] No shared state between tests

  **QA Scenarios**:

  ```
  Scenario: Loop progresses through phases
    Tool: Bash
    Steps: Run `pnpm test -- --grep "starts and progresses"`
    Expected: Test passes, loop reaches expected phases
    Evidence: .sisyphus/evidence/task-13-progress.txt

  Scenario: Cancellation stops loop
    Tool: Bash
    Steps: Run `pnpm test -- --grep "cancellation stops"`
    Expected: Test passes, cancellation event emitted
    Evidence: .sisyphus/evidence/task-13-cancel.txt
  ```

  **Commit**: YES | Message: `test(integration): OrchestrationLoop with mock ModelGateway` | Files: `packages/extension/test/integration/orchestration-loop.test.ts`

---

- [x] 14. Event log + snapshot projector full cycle (vitest — 3 tests)

  **What to do**:
  Create `packages/extension/test/integration/event-sourcing.test.ts` testing the full event sourcing cycle: append events to `FileEventLog`, then project them via `SnapshotProjector`.

  **Tests** (3 tests):
  1. `test('full cycle: append events, list by run, project snapshot')`:
     - Create `FileEventLog` with a temp dir (via `mkdtemp`)
     - Append >=5 events for a single run (start, milestone-begin, node-complete, milestone-end, run-complete)
     - Call `listByRun(runId)` and verify all events returned
     - Create `SnapshotProjector` and call `project(events)`
     - Verify projected `RunSnapshot` matches expected state (status: complete, milestones populated)

  2. `test('partial progress: snapshot shows running state with mixed milestone status')`:
     - Append events up to a partial point (run started, milestone 1 complete, milestone 2 failed)
     - Project snapshot
     - Verify snapshot shows running state with correct per-milestone status

  3. `test('empty event list: projector returns initial snapshot')`:
     - Project an empty event array
     - Verify result is an initial/empty snapshot state

  **Must NOT do**:
  - Don't duplicate `packages/extension/test/storage/events/file-event-log.test.ts` (tests FileEventLog in isolation)
  - Don't duplicate `packages/extension/test/storage/snapshots/snapshot-projector.test.ts` (tests projector with fixtures)
  - Focus on the INTEGRATION between the two: write → read → project

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: Multi-service integration test with filesystem
  - Skills: [] — No special skills needed
  - Omitted: [] — N/A

  **Parallelization**: Can Parallel: YES (no dependencies, parallelizable with Waves 2-5) | Wave 8 | Blocks: none | Blocked By: none

  **References**:
  - Event log: `packages/extension/src/storage/events/file-event-log.ts` — `FileEventLog` class with `append` and `listByRun`
  - Snapshot projector: `packages/extension/src/storage/snapshots/snapshot-projector.ts` — `SnapshotProjector` class with `project`
  - Event types: `packages/shared/src/contracts/index.ts` — `ExtensionEventSchema` Zod schema
  - Existing event tests: `packages/extension/test/storage/events/file-event-log.test.ts` — Tests `FileEventLog` in isolation with `mkdtemp` pattern
  - Existing snapshot tests: `packages/extension/test/storage/snapshots/snapshot-projector.test.ts` — Tests `SnapshotProjector` with fixture data
  - Mock event pattern: `packages/extension/test/storage/events/file-event-log.test.ts` — `makeEvent` helper function

  **Acceptance Criteria**:
  - [ ] `pnpm test` exits 0 including these new tests
  - [ ] Each test has a `// This tests [X] which is NOT covered by [existing test file]` comment
  - [ ] Each test creates a unique temp directory and cleans up in `afterEach`
  - [ ] Full cycle test writes >=5 events and verifies projected snapshot
  - [ ] No shared state between tests

  **QA Scenarios**:

  ```
  Scenario: Full event sourcing cycle
    Tool: Bash
    Steps: Run `pnpm test -- --grep "full cycle: append events"`
    Expected: Test passes, 5 events appended and listed, snapshot projection matches expected state
    Evidence: .sisyphus/evidence/task-14-full-cycle.txt

  Scenario: Partial progress snapshot
    Tool: Bash
    Steps: Run `pnpm test -- --grep "partial progress"`
    Expected: Test passes, snapshot shows running run with failed milestone
    Evidence: .sisyphus/evidence/task-14-partial.txt
  ```

  **Commit**: YES | Message: `test(integration): event log + snapshot projector full cycle on real filesystem` | Files: `packages/extension/test/integration/event-sourcing.test.ts`

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback → fix → re-run → present again → wait for okay.

- [x] F1. Plan Compliance Audit — oracle
      Verify every task matches its acceptance criteria. Check that all 14 tasks were implemented. Verify test count stays within the <=15 Playwright test cap (**current count: 9 Playwright tests**). Confirm no `page.waitForTimeout()` calls exist. Confirm `workers: 1` in playwright.config.ts.

- [x] F2. Code Quality Review — unspecified-high
      Review all new test files for: proper cleanup (afterEach/afterAll), no hardcoded timeouts, consistent use of `data-testid` selectors, fixture data validated against Zod schemas, meaningful test descriptions.

- [x] F3. Real Manual QA — unspecified-high (+ playwright if UI)
      Execute `npx playwright test` and `pnpm test` on the full suite. Capture pass/fail counts. Verify CI job definition by dry-running with `act` or inspecting YAML structure. Take screenshots of any failures.

- [x] F4. Scope Fidelity Check — deep
      Compare implementation against this plan: verify no scope creep (no extra production changes beyond Wave 0), no duplicate unit test coverage in Waves 6-8, no tests for dead code (timeline.update, graph/orchestration rendering). Verify each vitest integration test has a comment explaining what it covers that unit tests don't.

## Commit Strategy

| Wave | Commit # | Message                                                                           | Files                                                                                                                                                                                                                                    |
| ---- | -------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | 1        | `test(prep): add data-testid attributes to surface components and toast bar`      | `packages/webview/src/overview/OverviewSurface.tsx`, `packages/webview/src/repository/RepositorySurface.tsx`, `packages/webview/src/plan/PlanSurface.tsx`, `packages/webview/src/run/RunSurface.tsx`, `packages/webview/src/app/App.tsx` |
| 0    | 2        | `fix(webview): render degraded-mode error in OverviewSurface`                     | `packages/webview/src/overview/OverviewSurface.tsx`, `packages/webview/src/overview/model.ts`                                                                                                                                            |
| 1    | 3        | `test(e2e): add playwright config, VS Code launcher, and frame finder utilities`  | `playwright.config.ts`, `test/e2e/helpers/launch.ts`, `test/e2e/helpers/webview-frame.ts`, `package.json`                                                                                                                                |
| 1    | 4        | `test(e2e): add smoke test - launch VS Code, open panel, verify overview surface` | `test/e2e/smoke.test.ts`                                                                                                                                                                                                                 |
| 1    | 5        | `ci: add e2e job with Xvfb and trace artifacts`                                   | `.github/workflows/ci.yml`                                                                                                                                                                                                               |
| 2    | 6        | `test(e2e): handshake flow and degraded mode`                                     | `test/e2e/handshake.test.ts`                                                                                                                                                                                                             |
| 3    | 7        | `test(e2e): overview and repository surface rendering`                            | `test/e2e/surfaces-overview-repository.test.ts`, `test/e2e/fixtures/`                                                                                                                                                                    |
| 3    | 8        | `test(e2e): plan and run surface rendering`                                       | `test/e2e/surfaces-plan-run.test.ts`, `test/e2e/fixtures/`                                                                                                                                                                               |
| 4    | 9        | `test(integration): bridge command flows via handleWebviewMessage`                | `packages/extension/test/integration/bridge-commands.test.ts`                                                                                                                                                                            |
| 4    | 10       | `test(e2e): bridge validation resilience and toast rendering`                     | `test/e2e/bridge-validation-and-toasts.test.ts`                                                                                                                                                                                          |
| 5    | 11       | `test(integration): graph and orchestration store dispatch`                       | `packages/webview/test/integration/store-dispatch.test.ts`                                                                                                                                                                               |
| 6    | 12       | `test(integration): chat participant registration wiring`                         | `packages/extension/test/integration/chat-participant.test.ts`                                                                                                                                                                           |
| 7    | 13       | `test(integration): OrchestrationLoop with mock ModelGateway`                     | `packages/extension/test/integration/orchestration-loop.test.ts`                                                                                                                                                                         |
| 8    | 14       | `test(integration): event log + snapshot projector full cycle`                    | `packages/extension/test/integration/event-sourcing.test.ts`                                                                                                                                                                             |

## Success Criteria

1. **All Playwright E2E tests pass**: `npx playwright test` exits 0 with 9 Playwright tests (well under 15 cap)
2. **All vitest tests pass**: `pnpm test` exits 0 (includes 16 new integration tests across 5 files)
3. **Type safety**: `pnpm typecheck` exits 0
4. **Lint clean**: `pnpm lint` exits 0
5. **CI green**: E2E job passes on ubuntu-latest and windows-latest matrix
6. **Performance**: Total Playwright suite completes in <3 minutes on CI
7. **Deterministic**: No flaky tests on 3 consecutive CI runs
8. **Coverage**: All 4 surfaces tested (Playwright), all bridge command types tested (vitest), all toast behaviors tested (Playwright), store dispatch verified (vitest), chat/orchestration/events integration tested (vitest)
9. **No production regressions**: Existing 45+ unit/contract tests still pass
