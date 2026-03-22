# Attractor — AI Orchestration for VS Code

A VS Code extension that orchestrates multi-step AI coding workflows against Git repositories. Define plans as DOT graphs, execute them through the Copilot LM API, and track progress in a dashboard.

## Features

- **Plan-as-graph**: Define orchestration plans as DOT digraphs with typed nodes (`start`, `exit`, `codergen`, `conditional`, `wait.human`)
- **Copilot LM integration**: Execute plan nodes via the VS Code Copilot language model API
- **Dashboard**: Preact-based webview showing workspace overview, repository detail, and plan detail
- **Chat participant**: `@attractor` chat participant with `/plan`, `/run`, and `/status` commands
- **Milestone decomposition**: Break plans into milestones with artifact tracking
- **Event sourcing**: Append-only event log with snapshot projection for run state

## Getting Started

### Install from VSIX

1. Build the VSIX:
   ```bash
   pnpm install
   pnpm vsce:package
   ```
2. Install in VS Code:
   ```
   code --install-extension attractor.vsix
   ```
3. Open the Attractor panel from the activity bar

### Development

```bash
# Install dependencies
pnpm install

# Type-check all packages
pnpm typecheck

# Run all tests
pnpm test

# Lint
pnpm lint

# Format
pnpm format

# Build (TypeScript + webview bundle + extension bundle)
pnpm build

# Package VSIX
pnpm vsce:package
```

## Milestone Status

| Milestone                    | Status      | Notes                                                                 |
| ---------------------------- | ----------- | --------------------------------------------------------------------- |
| M0 — Scaffold                | Merged      | Monorepo tooling, CI, workspace structure                             |
| M1 — First Slices            | Merged      | Zod contracts, webview shell, runtime spine (PRs #1–5)                |
| M2 — Backend Spine           | Merged      | DOT validator, event log, registries, snapshot projector (PRs #6–10)  |
| M3 — First Dashboard Slice   | Merged      | Storage read surface, overview projection, bridge wiring (PRs #11–14) |
| M3.5–M3.9 — Dashboard Polish | Merged      | Design system, Tailwind v4, webview hosting (PRs #19–27)              |
| M4 — Copilot Orchestration   | Merged      | CopilotModelGateway, chat participant, orchestration loop (PR #28)    |
| M5 — Release Readiness       | In Progress | VSIX packaging, error boundary, CI validation, docs                   |

## Architecture

The project is a pnpm monorepo with three packages:

- **`packages/shared`** — Zod schemas and type contracts shared between extension and webview
- **`packages/extension`** — VS Code extension host (storage, orchestration, bridge, chat)
- **`packages/webview`** — Preact + Tailwind dashboard UI

See `docs/architecture/` for detailed architecture documentation.

## Planning Docs

- `docs/plans/roadmap.md`
- `docs/architecture/backend-architecture.md`
- `docs/architecture/contracts.md`
- `docs/testing-strategy.md`
- `docs/adrs/ADR-0001-thin-vertical-slice.md`

## License

MIT
