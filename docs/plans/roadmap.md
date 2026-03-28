# Roadmap

## v1

### Product Boundaries

- Repository-first dashboard
- One executable repository per plan
- Additional repositories allowed as read-only context
- Create, run, resume, cancel, and retry plans and milestones
- DOT parsing and validation for the v1 Attractor subset
- Graph rendering, timeline, logs, and artifacts
- Internal roles: orchestrator, planner, implementer, reviewer

### Included Node Types

- `start`
- `exit`
- `codergen`
- `conditional`
- `wait.human`

### Explicitly Deferred to v1.1

- `parallel`
- `fan_in`
- `tool`
- `manager_loop`
- simultaneous writable multi-repo execution

## Delivery Milestones

### Milestone 0 - Repo Setup

- workspace and build tooling
- docs and artifact templates
- CI skeleton

### Milestone 1 - Shared Contracts

- entities and schemas
- event and message contracts
- fixture and contract tests

### Milestone 2 - Backend Spine

- stores and projectors
- worktree manager
- DOT validation pipeline
- repository and plan registry

### Milestone 3 - First Dashboard Slice

- overview and repository views
- plan dashboard
- run inspector
- graph and timeline projections

### Milestone 3.5 - Review Cleanup And Hardening

- address unresolved High and Medium review feedback from merged PRs
- harden event log safety, runtime error boundaries, and worktree path consistency
- tighten shared contract tests and dashboard boot/runtime correctness

### Milestone 3.6 - Shared UI Contract Floor

- add missing shared entities: milestone runs, artifacts, and handoff envelope
- add typed inbound and outbound dashboard payload schemas
- add JSON fixtures for overview, repository, plan, run, timeline, and graph states

### Milestone 3.7 - Run-Scoped Persistence

- add milestone run and artifact registries
- store run-local detail under `storage/runs/<runId>/...`
- keep `RunSnapshot` as the derived read model for transient run state

### Milestone 3.8 - Dashboard Query And Projection Layer

- add one pure projector per outbound message type
- add shared join helpers for repository, plan, run, milestone, and snapshot lookups
- shape repository detail, plan dashboard, run inspector, timeline, and graph update payloads

### Milestone 3.9 - Webview Hosting And Styling Foundation

- register the real VS Code webview panel/view entrypoint
- add HTML shell, CSP, and `asWebviewUri` asset wiring
- add esbuild + Tailwind v4 pipeline for the webview package

### Milestone 4 - Copilot Orchestration

- chat participant
- role prompt builders
- handoff artifacts
- deterministic mocked model tests

### Milestone 5 - Release Readiness

- packaging
- evals
- startup recovery
- docs and runbooks
