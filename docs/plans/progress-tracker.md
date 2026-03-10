# Progress Tracker

This file tracks completed phases, current work, and the next intended handoff so progress is visible between sessions.

## Completed

### M0.1 - Project Memory And Model Routing

- Added project OpenCode config and instructions in `opencode.json`
- Added project routing rules in `AGENTS.md`
- Added explicit subagents in `.opencode/agents/`
- Added model routing notes in `docs/architecture/model-routing.md`

### M0.2 - Workspace Scaffold Created

- Added root workspace files: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `tsconfig.json`
- Added formatting and lint config: `eslint.config.mjs`, `.prettierrc.json`, `.gitignore`
- Added CI skeleton in `.github/workflows/ci.yml`
- Added initial `packages/shared`, `packages/extension`, and `packages/webview`
- Added placeholder fixtures, scripts, and test directories

## In Progress

### M0.3 - Align Scaffold With The Thin Slice Plan

Current focus:

- Add visible progress tracking
- Close basic tooling gaps discovered by review
- Keep M0 narrow and avoid drifting too far into M1

Known issues to address next:

- generate `pnpm-lock.yaml` so CI can use `--frozen-lockfile`
- add `format:check` to CI
- fix probable Vitest/ESM fixture path issues
- tighten the first contract boundaries so docs and schemas do not drift
- verify the current smoke test baseline is intentional for M0

## Next Up

### M0.4 - Install And Stabilize

- install dependencies
- generate lockfile
- run `pnpm lint`
- run `pnpm typecheck`
- run `pnpm test`
- fix failures until the scaffold is green

### M0.5 - Review Loop

- run primary review pass
- run secondary review pass
- fix findings that materially affect correctness or plan alignment

### M0.6 - Commit And Push

- commit the scaffold iteration to `main`
- push to `origin/main`

## Planned After M0

### M1 Prep - First Parallel Lanes

- lane 1: shared contracts
- lane 2: test and CI hardening
- lane 3: webview shell
- lane 4: extension runtime spine

## Session Resume Note

If a future session resumes here, start from `M0.4 - Install And Stabilize` unless this file says otherwise.
