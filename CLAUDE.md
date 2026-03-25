# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Attractor** is a VS Code extension that implements graph-driven multi-step coding workflows orchestrated via the Copilot SDK. It runs tasks in isolated git worktrees with persistent state, event sourcing, and LLM-guided execution. Currently at M0 scaffold (complete) with M1 in progress.

## Commands

```bash
pnpm install          # Install all dependencies (configures git hooks too)
pnpm build            # TypeScript compilation across all packages (tsc -b)
pnpm typecheck        # tsc -b --pretty false (strict, no emit)
pnpm lint             # ESLint across all .ts and .mjs files
pnpm format           # Prettier auto-fix
pnpm format:check     # Prettier check (CI)
pnpm test             # vitest run (all packages + meta tests)
pnpm ci:fast-checks   # lint + format:check + typecheck + test (CI gate)
```

Run a single test file:

```bash
pnpm vitest run packages/shared/test/contracts/repository.test.ts
```

## Monorepo Structure

`pnpm` workspace with three packages under `packages/`:

- **`@attractor/shared`** — Zod-validated contracts (entity schemas, webview message types). No internal deps. Everything persisted or sent cross-boundary lives here at `CONTRACT_VERSION = 1`.
- **`@attractor/extension`** — VS Code extension host. Entry: `src/extension.ts` → `src/runtime.ts`. Depends on `shared`. Currently stub commands; full orchestration wiring lands in M2+.
- **`@attractor/webview`** — Webview UI shell. Depends on `shared`. Handles state decoding/rendering for the dashboard.

Dependency direction: `extension` → `shared` ← `webview`. No circular deps.

## Architecture

### Backend (Extension Host)

Strict layered architecture — never skip layers:

1. **Domain** — pure business rules, entities, value objects, domain events (zero dependencies)
2. **Application** — orchestration policies, command handlers, event publishing (depends on domain + ports only)
3. **Infrastructure** — git, storage, Copilot adapters implementing application ports
4. **Extension** — VS Code activation, command registration, DI composition root

### Persistence (Tiered)

- **Tier 1**: VS Code `memento` for lightweight metadata
- **Tier 2**: `.attractor/` workspace directory — `runs/<runId>/run.json`, `runs/<runId>/events.ndjson`, `graphs/<graphId>.json`, `worktrees/leases.json`
- **Tier 3**: In-memory projections derived from snapshots + event replay

### Event Sourcing

Domain events use immutable envelopes with `id`, `name`, `aggregateType`, `aggregateId`, `correlationId`, `timestamp`, `payload`. Event log is append-only. Projections are rebuilt from snapshots + replay.

### Worktree Isolation

Each run gets a dedicated git worktree named `attractor/<runId>`. Ownership enforced via lease store. Lifecycle: `allocate → prepare → busy → release → destroy/retain`.

### Contract-First

All persisted and cross-boundary payloads are Zod-validated and versioned (`version: 1`). No untyped JSON anywhere. Add contracts to `@attractor/shared` before implementing consumers.

## TypeScript Conventions

`tsconfig.base.json` enforces: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`. All packages extend this base. CommonJS modules targeting ES2022.

## Testing

Four test suites run via Vitest:

- `packages/shared/` — contract unit tests with valid/invalid JSON fixtures
- `packages/webview/` — component and decoder tests
- `packages/extension/` — smoke tests via `@vscode/test-electron`
- `test/meta/` — workflow drift tests (checks that implementation stays aligned with plans)

Test fixtures live in `test/fixtures/contracts/` and `test/fixtures/webview/`. Mock the `ModelGateway` boundary (`send()` / `stream()`) rather than Copilot internals.

Coverage targets: `shared` ≥ 90%, `extension` core ≥ 85%, `webview` ≥ 80%.

## Agent Routing (opencode.json / AGENTS.md)

This project uses multi-agent orchestration via OpenCode:

- **Queen**: `github-copilot/gpt-5.4` — orchestrates swarm, delegates, watches CI
- **`@ttd-orchestrator`** / **`@ttd-planner`**: GPT-5.4 — decomposition and TDD planning
- **`@ttd-implementer`**: Claude Haiku 4.5 — small red-green-refactor iterations
- **`@code-reviewer`**: Gemini 2.5 Pro — primary design review
- **`@plan-drift-reviewer`**: Claude Sonnet 4.6 — drift review at loop boundaries

Use `jcodemunch` MCP for indexed code/symbol search; use raw reads for markdown, JSON, and config files.

## Roadmap

- **M0** ✅ Tooling, docs, CI skeleton
- **M1** 🔄 Shared contracts, event model, runtime spine, webview shell
- **M2** Storage, worktree manager, DOT parser, repository registry
- **M3** Dashboard (overview, repo/plan/run inspector, graph/timeline)
- **M4** Copilot orchestration (chat participant, role prompts, handoff artifacts)
- **M5** Release (packaging, evals, recovery, docs)

v1 scope: sequential execution only, one writable repo per plan. Parallel lanes deferred to v1.1.
