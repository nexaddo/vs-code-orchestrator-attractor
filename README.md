# Attractor

**Attractor** is a VS Code extension that implements graph-driven multi-step coding workflows orchestrated via the Copilot SDK. Tasks run in isolated git worktrees with persistent state, event sourcing, and LLM-guided execution.

## Status

| Milestone | Status         | Description                                                               |
| --------- | -------------- | ------------------------------------------------------------------------- |
| M0        | ✅ Done        | Tooling, docs, CI skeleton                                                |
| M1        | ✅ Done        | Shared contracts, event model, runtime spine, webview shell               |
| M2        | ✅ Done        | Storage, worktree manager, DOT parser, repository registry                |
| M3        | ✅ Done        | Dashboard UI — repository, plan, run, timeline, graph inspectors          |
| M4        | ✅ Done        | Copilot orchestration — chat participant, role prompts, handoff artifacts |
| M5        | 🔄 In Progress | Release — packaging, evals, recovery, docs                                |

## Features

- **Graph-driven orchestration** — define workflows as DOT graphs; Attractor executes each node via the Copilot SDK
- **Worktree isolation** — each run gets a dedicated `git worktree`, preventing cross-run contamination
- **Event sourcing** — all state changes are appended to an NDJSON event log for full auditability and replay
- **Dashboard** — VS Code webview showing repository registry, plan inspector, run timeline, and graph viewer
- **Copilot integration** — built-in chat participant (`@attractor`) for natural-language orchestration control

## Requirements

- VS Code `≥ 1.103.0` with GitHub Copilot extension enabled
- Node.js `≥ 22`
- Git (in PATH)

## Installation

> Pre-release: VSIX not yet published to the Marketplace. Build from source:

```bash
git clone https://github.com/YOUR_ORG/vs-code-orchestrator-attractor
cd vs-code-orchestrator-attractor
pnpm install
pnpm pack          # produces packages/extension/attractor-*.vsix
```

Install the generated `.vsix` in VS Code: **Extensions → ··· → Install from VSIX…**

## Commands

| Command                        | Description                                       |
| ------------------------------ | ------------------------------------------------- |
| `Attractor: Start Run`         | Begin a new orchestration run for the active plan |
| `Attractor: Cancel Run`        | Cancel the currently active run                   |
| `Attractor: Create Plan`       | Create a new plan from a DOT graph file           |
| `Attractor: Add Repository`    | Register a repository with the current workspace  |
| `Attractor: Remove Repository` | Deregister a repository                           |
| `Attractor: List Repositories` | Show all registered repositories                  |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for dev setup, branching strategy, and the release process.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the layered backend design, event sourcing model, and worktree lifecycle.

## License

MIT — see [LICENSE](LICENSE).
