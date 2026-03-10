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
