# Repository Scaffold Plan

## Goals

- Keep the first implementation small enough to ship a reliable v1
- Separate extension runtime, webview UI, and shared contracts without creating a large platform too early
- Make testing, evals, and artifact-backed handoffs first-class from day one
- Preserve a clean path to v1.1 multi-repo execution and advanced Attractor nodes

## Recommended Repository Shape

```text
.
├─ .github/
│  ├─ workflows/
│  │  ├─ ci.yml
│  │  ├─ release.yml
│  │  └─ nightly-evals.yml
│  └─ PULL_REQUEST_TEMPLATE.md
├─ .vscode/
│  ├─ launch.json
│  └─ tasks.json
├─ artifacts/
│  ├─ handoffs/
│  └─ task-packs/
├─ docs/
│  ├─ adrs/
│  ├─ architecture/
│  ├─ plans/
│  └─ reviews/
├─ evals/
│  ├─ golden/
│  ├─ harness/
│  └─ scenarios/
├─ packages/
│  ├─ extension/
│  ├─ shared/
│  └─ webview/
├─ prompts/
│  ├─ implementer/
│  ├─ orchestrator/
│  ├─ planner/
│  └─ reviewer/
├─ scripts/
├─ test/
│  ├─ fixtures/
│  ├─ helpers/
│  └─ snapshots/
├─ package.json
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
└─ README.md
```

## Package Boundaries

### `packages/extension`

- VS Code activation, commands, chat participant, worktree orchestration, persistence, model integration, and telemetry
- Owns extension host state and file system side effects
- Depends on `packages/shared`

### `packages/webview`

- Dashboard UI, graph projection, timeline UI, filters, and inspector panels
- Receives typed messages from the extension host
- Depends on `packages/shared`

### `packages/shared`

- Domain contracts, schemas, event types, DTOs, validators, and shared utilities
- No direct `vscode` dependency
- Must stay deterministic and unit-test heavy

## Scaffolding Rules

- Keep source code under `packages/*/src`
- Keep user-facing design and implementation intent in `docs/`
- Keep orchestration prompts versioned in `prompts/`
- Keep task handoffs and planning packets in `artifacts/`
- Keep runtime logs, generated outputs, and large test captures out of git

## Delivery Workflow

1. Orchestrator creates or updates a feature brief
2. Planner creates a feature plan and task pack
3. Implementer writes failing tests, then code
4. Reviewer records risks, regressions, and approval notes
5. CI validates code, contracts, packaging, and eval scenarios

## Initial Milestones

### M0 - Foundation

- Root workspace scaffold
- Shared TypeScript config, lint, format, and package tooling
- Unit test harness and one extension smoke test

### M1 - Contracts First

- Shared contracts package
- Session, event, run, milestone, and webview message schemas
- Contract tests and fixture layout

### M2 - Runtime Spine

- Extension activation
- Repository registry
- Plan store and run store
- Worktree manager skeleton
- Event log and projector

### M3 - Dashboard Vertical Slice

- Repository list
- Plan detail
- Run detail
- DOT graph rendering
- Timeline and logs

### M4 - Copilot Spine

- `@attractor` participant
- Role prompt packets
- Planner -> implementer -> reviewer handoff flow

### M5 - Hardening

- Resume, retry, cancel
- Startup reconciliation
- Eval harness
- Packaging and release workflow

## CI and Release Pipelines

### Pull Request Pipeline

1. Install and restore cache
2. Lint and format check
3. Typecheck
4. Unit tests
5. Contract tests
6. Webview tests in the first post-M0 hardening lane
7. Extension integration smoke tests in the first post-M0 hardening lane
8. VSIX packaging smoke test in the first post-M0 hardening lane

### Main Branch Pipeline

- All PR checks
- Golden eval scenarios
- Release note draft generation
- Artifact archive for failed runs

### Release Pipeline

- Tag and package VSIX
- Produce checksums and changelog
- Publish extension
- Run install smoke test against a clean VS Code instance

## First Files to Create During Implementation

- root `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `packages/shared/package.json`
- `packages/extension/package.json`
- `packages/webview/package.json`
- `.github/workflows/ci.yml`
- `packages/extension/src/extension.ts`
- `packages/shared/src/contracts/index.ts`

## v1 Scope Guardrails

- One writable repository per plan
- Read-only context repositories only
- Linear milestone execution only
- DOT graph remains canonical in source text; rendered graph is a projection
- No visual graph editing in v1
