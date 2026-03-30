# M5 — Release Readiness

## Goal

Make the Attractor VS Code extension installable, resilient, and documented.
Ship a `.vsix` that activates cleanly, recovers from storage failures,
and passes packaging validation in CI.

## Architecture Decisions (locked)

1. **Extension host bundling via esbuild** — single-file CJS output at
   `packages/extension/dist/bundle/extension.js`. The webview already has its
   own esbuild pipeline; the extension host gets a parallel one.
2. **Webview asset staging** — the extension esbuild config copies the
   webview bundle (`packages/webview/dist/bundle/`) into the extension
   package at `dist/bundle/webview/` during build. The runtime constant
   `ATTRACTOR_WEBVIEW_BUNDLE_PATH` is updated from
   `["packages", "webview", "dist", "bundle"]` to `["dist", "bundle", "webview"]`
   so that webview assets resolve correctly both in development (via
   `extensionDevelopmentPath` pointing to repo root — still works because
   the copied files exist under the extension package) and when installed
   from a VSIX (where `extensionUri` is the extension package root).
   Tests and webview-provider test fixtures are updated to match the new path.
3. **`@vscode/vsce` for packaging** — added as a root devDependency. The
   `vsce:package` script produces a `.vsix` from the extension package.
4. **Output channel for activation diagnostics** — a VS Code OutputChannel
   (`"Attractor"`) logs startup lifecycle, storage resolution, and error
   recovery. No telemetry in v1.
5. **Startup error boundary** — `activateAttractor` catches exceptions from
   storage init, model gateway init, and provider registration. On failure,
   the extension degrades gracefully (commands still register, dashboard shows
   error state).
6. **VSIX content validation in CI** — a new workflow step runs
   `vsce package --no-dependencies` and validates the output contains exactly
   the expected files (no tests, no docs, no source).

## Slices

### Wave 1 (no dependencies)

#### Slice 1 — Extension host esbuild bundler and webview asset staging
**Files**: `packages/extension/esbuild.config.mjs` (NEW), `packages/extension/package.json`,
`packages/extension/src/runtime.ts`, root `package.json`,
`packages/extension/test/dashboard/webview-provider.test.ts`,
`packages/extension/test/smoke/activation.test.ts`
**What**:
1. Add `esbuild` as a devDependency to `packages/extension/package.json`
   (needed by the esbuild config below).
2. Create an esbuild config that bundles `src/extension.ts` → `dist/bundle/extension.js`
   as a single CJS file. Externalize `vscode`. Support `--watch` flag.
3. After esbuild completes, copy `packages/webview/dist/bundle/` contents
   (webview.js, webview.css) into `packages/extension/dist/bundle/webview/`.
   Use Node `fs.cpSync` (recursive) in the esbuild config's post-build step.
4. Add `"build:bundle"` script to extension package.json:
   `"build:bundle": "node esbuild.config.mjs"`
5. Update `"main"` in extension package.json to `"dist/bundle/extension.js"`.
6. Update `ATTRACTOR_WEBVIEW_BUNDLE_PATH` in `runtime.ts` from
   `["packages", "webview", "dist", "bundle"]` to `["dist", "bundle", "webview"]`.
7. Update all `webviewBundlePath` references in
   `webview-provider.test.ts` and `activation.test.ts` to use the new path.
8. Update root `package.json` build script to also run the extension bundler:
   `"build": "tsc -b && pnpm --filter @attractor/webview build:bundle && pnpm --filter @attractor/extension build:bundle"`
   Note: production mode detection is handled inside each esbuild config via
   `process.env.NODE_ENV` (defaults to production for one-shot builds, dev
   for watch mode). No POSIX-style env prefix needed in the npm script.
**Tests**: Run the bundler, verify output file exists, verify `vscode` is not inlined,
verify `dist/bundle/webview/webview.js` exists after bundling.
**QA**: First build the webview bundle (prerequisite):
`pnpm --filter @attractor/webview build:bundle`
Then run the extension bundler:
`node packages/extension/esbuild.config.mjs` → exit code 0.
Run `node -e "const fs=require('fs'); const s=fs.statSync('packages/extension/dist/bundle/extension.js'); console.log(s.size); process.exit(s.size > 512000 ? 1 : 0)"` → exit 0 (< 500KB).
Run `node -e "require('fs').statSync('packages/extension/dist/bundle/webview/webview.js')"` → no error (file exists).
Run `pnpm typecheck && pnpm test` → all pass.

#### Slice 2 — `.vscodeignore` and packaging metadata
**Files**: `packages/extension/.vscodeignore` (NEW), `packages/extension/package.json`,
`packages/extension/resources/attractor-icon.png` (NEW)
**What**: Create `.vscodeignore` excluding `src/`, `test/`, `dist/src/`, `node_modules/`,
`*.map`, `tsconfig*`, `vitest*`, `esbuild*`. Add `publisher` field (value: `"attractor"`),
set version to `0.1.0`, add `"categories": ["AI", "Machine Learning"]`,
add `"icon": "resources/attractor-icon.png"` (placeholder 128×128 PNG).
Update the existing `"icon": "resources/attractor-icon.svg"` reference in
`contributes.viewsContainers.activitybar[0]` to `"resources/attractor-icon.png"`
(or create a minimal SVG alongside it — the activitybar icon is separate from
the marketplace icon). Create `packages/extension/resources/` directory and
a placeholder icon PNG (minimal valid 1×1 or 128×128 PNG).
**Tests**: None (validated by Slice 5).
**QA**: Run `node -e "const p=require('./packages/extension/package.json'); console.assert(p.publisher==='attractor'); console.assert(p.version==='0.1.0'); console.assert(p.categories.includes('AI')); console.assert(p.icon==='resources/attractor-icon.png'); console.log('PASS')"` → prints "PASS".
Run `node -e "require('fs').statSync('packages/extension/.vscodeignore')"` → no error.
Run `node -e "require('fs').statSync('packages/extension/resources/attractor-icon.png')"` → no error.

#### Slice 3 — Startup error boundary and output channel
**Files**: `packages/extension/src/runtime.ts`, `packages/extension/test/smoke/activation.test.ts`
**What**: Wrap `activateAttractor` body in try-catch. Create an OutputChannel
`"Attractor"` for diagnostic logging. Log: storage root resolution,
services creation success/failure, provider registration, chat participant
registration. On storage failure: log error, continue activation with
services=null. On provider/chat failure: log error, continue (non-fatal).
Add `OutputChannelLike` seam to `RuntimeDependencies` with signature
`{ appendLine(value: string): void }`.

**Degraded state handling** (when `services === null`): Update
`context.onWebviewMessage` in `runtime.ts` so that when `services` is null
and the webview sends a `"ready"` message, the handler posts an
`overview.state` response with an empty degraded payload:
```ts
{ version: 1, requestId, type: "overview.state",
  payload: { repositories: [], activeRuns: [], recentFailures: [],
             stats: { totalRepos: 0, totalPlans: 0, activeRuns: 0, pausedRuns: 0, failedRuns24h: 0 },
             error: "Storage unavailable — check output channel for details" } }
```
This ensures the webview receives a response instead of being silently
ignored. The `error` field is a new optional string on the existing
`OverviewStatePayloadSchema` (in `packages/shared/src/contracts/index.ts`).
The webview store already handles `overview.state` and can display the
error string when present (the rendering of the error banner is
out-of-scope for this slice — the data path is what matters).

**Additional files** (for the `error` field on OverviewState):
`packages/shared/src/contracts/index.ts` — add optional `error?: string`
to `OverviewStatePayloadSchema`.
`packages/shared/test/contracts/webview-message.test.ts` — add 1 test:
`OverviewStatePayload` accepts optional `error` field.

**Tests**: 5 new tests — storage init throws → activation succeeds with null services;
createStorageServices throws → output channel logs error; provider registration
throws → activation continues; chat registration throws → activation continues;
ready message with null services → posts degraded overview.state with error field.
**QA**: Run `pnpm typecheck` → exit 0.
Run `pnpm test` → all existing tests pass + 5 new tests pass (verify count ≥ 482).
Run `pnpm lint` → exit 0.

#### Slice 4 — CHANGELOG.md
**Files**: `CHANGELOG.md` (NEW)
**What**: Create CHANGELOG.md with v0.1.0 entry covering M0–M4 highlights.
Follow [Keep a Changelog](https://keepachangelog.com/) format.
**Tests**: None.
**QA**: Run `node -e "const fs=require('fs'); const c=fs.readFileSync('CHANGELOG.md','utf8'); console.assert(c.includes('0.1.0')); console.assert(c.includes('## ')); console.log('PASS')"` → prints "PASS".
Run `pnpm exec prettier --check CHANGELOG.md` → exit 0.

### Wave 2 (depends on Wave 1)

#### Slice 5 — `vsce:package` script and VSIX validation
**Files**: root `package.json`, `packages/extension/package.json`
**Depends on**: Slice 1 (bundler + webview staging), Slice 2 (vscodeignore + metadata)
**What**: Add `@vscode/vsce` as root devDependency.
Add script `vsce:package` to root package.json:
`"vsce:package": "pnpm build && pnpm --filter @attractor/extension exec vsce package --no-dependencies -o ../../attractor.vsix"`
This runs `vsce package` from the extension package directory (via `--filter`),
outputting the `.vsix` to the repo root. Validate the VSIX can be created.
Add script `vsce:ls` to root package.json for convenience:
`"vsce:ls": "pnpm --filter @attractor/extension exec vsce ls --no-dependencies"`
**Tests**: Manual — run `pnpm vsce:package`, verify .vsix is produced.
**QA**: Run `pnpm vsce:package` → exit 0.
Run `node -e "require('fs').statSync('attractor.vsix')"` → no error (file exists).
Run `pnpm vsce:ls` → stdout includes `dist/bundle/extension.js`,
`dist/bundle/webview/webview.js`, `dist/bundle/webview/webview.css`;
stdout does NOT include any `.ts` source files (except `.d.ts`), no `test/` paths.

#### Slice 6 — CI packaging validation
**Files**: `.github/workflows/ci.yml`
**Depends on**: Slice 5 (vsce:package)
**What**: Add a `package-check` job that runs after `fast-checks`. It runs
`pnpm build` then `pnpm --filter @attractor/extension exec vsce package --no-dependencies`,
then validates the VSIX contents don't include test files or source TypeScript
(using `pnpm --filter @attractor/extension exec vsce ls --no-dependencies`
piped through a shell assertion).
**Tests**: CI validates on PR.
**QA**: Push branch, verify CI shows green `package-check` job alongside `fast-checks`.

#### Slice 7 — README and docs refresh
**Files**: `README.md`, `packages/extension/package.json` (repository field)
**Depends on**: Slice 4 (CHANGELOG exists)
**What**: Update README milestone table through M4. Add "Getting Started" section
with install-from-vsix instructions. Add "Development" section with build/test
commands. Add `repository`, `license`, `homepage` fields to extension package.json.
**Tests**: None.
**QA**: Run `pnpm exec prettier --check README.md` → exit 0.
Run `node -e "const p=require('./packages/extension/package.json'); console.assert(p.repository); console.assert(p.license); console.log('PASS')"` → prints "PASS".
Run `node -e "const r=require('fs').readFileSync('README.md','utf8'); console.assert(r.includes('Getting Started')); console.assert(r.includes('Development')); console.assert(r.includes('M4')); console.log('PASS')"` → prints "PASS".

### Wave 3 (depends on Wave 2)

#### Slice 8 — VSIX content smoke test
**Files**: `test/smoke/vsix-content.test.ts` (NEW), `test/smoke/vitest.config.ts` (NEW),
`vitest.config.ts` (MODIFY — add smoke project to `test.projects`)
**Depends on**: Slice 5 (packaging works)
**What**: Create `test/smoke/vitest.config.ts` following the existing
`test/meta/vitest.config.ts` pattern:
```ts
export default defineConfig({ test: { name: "smoke", include: ["*.test.ts"] } })
```
Add `"test/smoke/vitest.config.ts"` to root `vitest.config.ts` `test.projects` array.
Create `test/smoke/vsix-content.test.ts` that first runs
`pnpm build` (to ensure webview and extension bundles exist), then shells
out to `pnpm --filter @attractor/extension exec vsce ls --no-dependencies`,
captures stdout, and asserts:
- `dist/bundle/extension.js` is listed
- `dist/bundle/webview/webview.js` is listed
- `dist/bundle/webview/webview.css` is listed
- No `.ts` source files (except `.d.ts`)
- No `test/` paths
- No `node_modules/` paths (since `--no-dependencies`)
**Tests**: The test itself is the validation. Note: the test runs
`pnpm build` internally as a setup step (with a generous timeout) to
guarantee build artifacts exist before asserting on `vsce ls` output.
**QA**: Run `pnpm build` first (prerequisite), then:
Run `pnpm test` → all tests pass including the new smoke test.
Run `pnpm test -- --reporter=verbose` → output includes `smoke` project with
`vsix-content` test name visible.

## Dependency Graph

```
Slice 1 ──┐
Slice 2 ──┼──→ Slice 5 ──→ Slice 6
           │              ──→ Slice 8
Slice 3 ──┘ (independent, no downstream deps)
Slice 4 ──────→ Slice 7
```

Note: Slice 3 has no downstream dependencies — it can be merged independently.
Slices 1 and 2 are the critical path for packaging (Slices 5/6/8).

## Wave Schedule

| Wave | Slices | Parallel? |
|------|--------|-----------|
| 1    | 1, 2, 3, 4 | Yes — all independent |
| 2    | 5, 6, 7 | Partially — 5 and 7 are independent; 6 depends on 5 |
| 3    | 8 | Sequential — needs packaging to work |

## Out of Scope (deferred)

- Marketplace publishing (needs org-level publisher account)
- Extension integration tests with `@vscode/test-electron` (heavy infra, defer to M6)
- Bundle size budgets (nice-to-have, not blocking v0.1.0)
- Telemetry / error reporting service
- `startOrchestration` wiring to real OrchestrationLoop (M4.5/M6 scope)
