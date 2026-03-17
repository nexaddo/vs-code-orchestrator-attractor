# M3 Lane Plan

> Assumption: M3 ships one thin vertical slice — a live overview panel reading real data from storage end-to-end. No full dashboard, no run inspector detail, no graph/timeline views.

## Bottom Line

M3 ships one thin vertical slice: a live overview panel that loads through the existing `ready` → `state.update` message flow, reads real repository/plan/run data from `StorageServices`, projects it into `OverviewState`, and renders those counts in the webview without a VS Code launch test. M3 explicitly defers repository drill-downs, plan dashboards, run inspector details, graph/timeline projections, background auto-refresh subscriptions, and any expansion of `packages/shared/src/contracts/index.ts` unless a blocking defect is discovered in the current schemas.

## Lane Summary

| Lane                            | Branch                        | Scope                                                                            | Depends on | Status                        |
| ------------------------------- | ----------------------------- | -------------------------------------------------------------------------------- | ---------- | ----------------------------- |
| L1 — Storage read surface       | `m3/storage-read-surface`     | Standardize minimal read APIs to enumerate repositories, plans, and runs         | —          | ✅ MERGED (PR #11, `0ec7756`) |
| L2 — Overview projection        | `m3/overview-projection`      | Pure projection functions mapping `StorageServices` reads → `OverviewState`      | L1         | ✅ MERGED (PR #13, `e38e276`) |
| L3 — Webview overview shell     | `m3/webview-overview-shell`   | Tighten overview renderer/decoder; lock UI to summary-only slice                 | —          | ✅ MERGED (PR #12, `9f2ed2b`) |
| L4 — Dashboard bridge + runtime | `m3/dashboard-bridge-runtime` | Wire `ready`/`state.update` end-to-end between runtime, bridge, and webview boot | L2, L3     | pending                       |

## Single-Owner File Reservations

- `packages/shared/src/contracts/index.ts` — **frozen for M3**. No planned changes. If a blocking schema bug is found, only L4 may touch it.
- `packages/extension/src/storage/services.ts` and all files under `packages/extension/src/storage/repositories/**`, `plans/**`, `runs/**` — **L1 only**.
- `packages/extension/src/dashboard/overview-projection.ts` (and its tests) — **L2 only**.
- `packages/webview/src/overview/model.ts`, `renderer.ts`, `decoder.ts` — **L3 only**.
- `packages/extension/src/runtime.ts`, `packages/webview/src/index.ts`, and all non-projection files under `packages/extension/src/dashboard/**` — **L4 only**.

---

## Lane Details

### L1 — Storage Read Surface

**Branch:** `m3/storage-read-surface`

**Scope**

- Standardize one minimal public read path for `repositoryRegistry`, `planRegistry`, and `runRegistry` so the dashboard can enumerate records without knowing file layout.
- Keep the read surface narrow: enough to derive `repositoryCount`, `planCount`, and `activeRunCount`; no new orchestration behavior, no write-path changes.
- Own `packages/extension/src/storage/services.ts` plus any touched registry interfaces/implementations under `packages/extension/src/storage/**`.

**Acceptance criteria**

- Unit/integration tests can populate file-backed storage and read repository, plan, and run records through the public storage interfaces only.
- The storage read path exposes enough information for overview counts without reaching into JSON files or storage directory conventions directly.
- The run read path preserves status values needed for counting active runs, with tests covering at least `queued`, `running`, `paused`, `completed`, `failed`, and `canceled`.

---

### L2 — Overview Projection

**Branch:** `m3/overview-projection`

**Scope**

- Add a pure projection module that reads from `StorageServices` and returns `OverviewState` for the M3 workspace summary only.
- Define the M3 counting rule once: `activeRunCount` includes `queued`, `running`, and `paused`; all terminal statuses (`completed`, `failed`, `canceled`) are excluded.
- Keep this lane free of `vscode` and webview objects; own one carved-out projection file under `packages/extension/src/dashboard/**` and its tests.

**Acceptance criteria**

- Projection tests cover empty storage, mixed repository/plan/run populations, and mixed run statuses.
- The projection layer has no dependency on VS Code APIs, webview APIs, or HTML rendering.
- The returned state matches the existing `OverviewState` shape and does not require a shared contract change.

---

### L3 — Webview Overview Shell

**Branch:** `m3/webview-overview-shell`

**Scope**

- Keep the webview UI limited to the existing overview summary; make the rendered HTML explicitly show repository, plan, and active run counts.
- Add or tighten tests for `renderOverview` and `decodeOutboundMessage` so the webview side is stable before runtime wiring lands.
- Own `packages/webview/src/overview/model.ts`, `renderer.ts`, and `decoder.ts`; do **not** touch `packages/webview/src/index.ts`.

**Acceptance criteria**

- Renderer tests cover both zero-state and populated-state output.
- Decoder tests accept valid `state.update` messages and reject malformed payloads through the shared schema path.
- No repository list, plan list, run inspector, graph view, or timeline view is introduced in this lane.

---

### L4 — Dashboard Bridge and Runtime Wiring

**Branch:** `m3/dashboard-bridge-runtime`

**Scope**

- Create the extension-side dashboard bridge in `packages/extension/src/dashboard/**` that handles webview `ready`, invokes the overview projection, and posts a `state.update` message.
- Wire the bridge into `packages/extension/src/runtime.ts` and make `packages/webview/src/index.ts` send `kind: "ready"` once the webview bootstraps.
- Keep runtime behavior minimal: initial load-on-ready plus explicit refresh on `ready`; automatic subscriptions to storage mutations are deferred.

**Acceptance criteria**

- Integration tests can simulate a `ready` message and observe one valid `state.update` response carrying projected real-data counts.
- Bridge/runtime tests use fakes or thin adapters around VS Code/webview seams; no E2E extension host launch is required.
- This lane is the **only** lane touching message-passing files: `packages/extension/src/runtime.ts`, `packages/webview/src/index.ts`, and non-projection files under `packages/extension/src/dashboard/**`.
- `packages/shared/src/contracts/index.ts` remains unchanged unless a blocking schema bug is discovered and explicitly fixed here.

---

## Dependencies

### Hard Dependencies

- **L2** depends on **L1** — the projector needs a stable, public storage read surface.
- **L4** depends on **L2** — bridge code calls the finished overview projector; no duplicate count logic in the bridge.
- **L4** depends on **L3** — boot handshake and outgoing message wiring lands against the final M3 renderer/decoder.
- `packages/shared/src/contracts/index.ts` is frozen; if L4 must change it, every unmerged lane rebases before merge.

### Safe Parallelism

#### Wave 1 — safe immediately

- **L1** and **L3** can run in parallel.

#### Wave 2 — safe after L1 merges

- **L2** starts once L1's storage read surface is stable.

#### Wave 3 — safe after L2 and L3 merge

- **L4** integrates bridge and runtime wiring once both projection and webview shell are stable.

## Recommended Merge Order

1. `m3/storage-read-surface` (L1)
2. `m3/webview-overview-shell` (L3)
3. `m3/overview-projection` (L2)
4. `m3/dashboard-bridge-runtime` (L4)

## Watch Out For

1. **Count rule drift for active runs.** If different lanes treat `paused` differently, the overview will disagree with storage-backed tests immediately. Define `activeRunCount` = `queued | running | paused` once in L2 and never restate it elsewhere.
2. **Bridge logic duplicating projection logic.** If L4 recomputes counts instead of calling the L2 projector, the slice stops being testable and drifts as soon as summary rules change.
3. **Cross-lane contention on `runtime.ts`, `packages/webview/src/index.ts`, and `packages/extension/src/dashboard/**`.\*\* Enforce file reservations before branches open, or merge churn will dominate.
4. **Premature schema expansion.** Adding repository/run detail to the shared outbound contract will balloon M3 into a dashboard redesign and force unnecessary cross-package churn.
5. **Sneaking in background refresh/event subscriptions.** The thin slice only needs load-on-ready; event-driven refresh belongs to a later milestone once real mutation paths exist.
