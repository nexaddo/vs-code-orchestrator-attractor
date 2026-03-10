# Testing Strategy

## Goals

- deterministic by default
- fast enough for pull requests
- no live Copilot or provider calls in standard CI
- contract-first for persisted state and UI message boundaries
- test pyramid that favors pure logic over broad integration suites

## Test Layout

```text
test/
├─ fixtures/
│  ├─ contracts/
│  ├─ models/
│  ├─ webview/
│  └─ workspaces/
├─ helpers/
└─ snapshots/

packages/
├─ extension/
│  └─ test/
├─ shared/
│  └─ test/
└─ webview/
   └─ test/
```

## Tooling

- `pnpm`
- `typescript`
- `vitest`
- `@vitest/coverage-v8`
- `@vscode/test-electron`
- `playwright`
- `@testing-library/*`
- `eslint`
- `prettier`
- `zod`

## Test Layers

### Unit Tests

Test pure logic only:

- state reducers
- event projectors
- contract helpers
- retry policies
- prompt assembly
- memory ranking and compaction
- graph validation helpers

Rules:

- no direct `vscode` imports
- no live network
- filesystem only through fixtures

### Contract Tests

Lock down:

- repository, plan, milestone, run, and worktree schemas
- webview inbound and outbound messages
- handoff envelopes
- event log payloads

Each contract gets:

- valid fixtures
- invalid fixtures
- round-trip tests
- migration tests when versions change

### Integration Tests

Use `@vscode/test-electron` for:

- extension activation
- command registration
- storage reads and writes
- webview message bridge wiring
- worktree manager orchestration with fixture repos

### Webview Tests

#### Component Tests

- filters
- state cards
- timeline panels
- graph selection
- empty, loading, and error states

#### Browser Smoke Tests

- overview loads
- repository detail renders
- run inspector handles streamed updates
- focus and keyboard flows still work

## Mocked Model Strategy

Define one narrow model boundary:

```ts
interface ModelGateway {
  send(request: ModelRequest): Promise<ModelResponse>;
  stream(request: ModelRequest): AsyncIterable<ModelChunk>;
}
```

Use fakes for:

- successful completion
- structured output failure
- streamed chunk flow
- timeout
- cancellation
- rate limit

## Fixtures

### Workspace Fixtures

- `minimal/`
- `multi-root/`
- `with-git/`
- `with-dot-graphs/`

### Model Fixtures

- `completion-success.json`
- `structured-output-invalid.json`
- `stream-success.ndjson`
- `stream-cancelled.ndjson`

### Contract Fixtures

- `contracts/plans/valid/*.json`
- `contracts/plans/invalid/*.json`
- same pattern for runs, events, memory, and webview messages

## Quality Gates

Minimum checks on every PR:

- lint
- format check
- typecheck
- unit tests
- contract tests
- webview tests after the first webview shell lane lands
- extension integration smoke tests after the first runtime hardening lane lands
- VSIX packaging smoke test after the first packaging lane lands

Suggested initial coverage targets:

- `packages/shared`: 90% lines
- `packages/extension` core logic: 85% lines
- `packages/webview` logic: 80% lines

## CI Jobs

### `fast-checks`

- install
- lint
- format check
- typecheck
- unit tests
- contract tests

### `webview`

- build shared and webview
- run component tests
- run Playwright smoke tests

### `extension-integration`

- build extension
- run extension host tests on Windows and Linux

### `package-smoke`

- create VSIX
- install into clean test instance
- verify activation and one smoke command

### `nightly-evals`

- run golden scenarios
- optional real-provider drift checks behind secrets

## Definition Of Done

A feature is not done until it has:

- unit coverage for new logic
- contract updates for changed payloads
- integration coverage for changed VS Code wiring
- webview tests for changed UI behavior
- updated fixtures and passing CI
