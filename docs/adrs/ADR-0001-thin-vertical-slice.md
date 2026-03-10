# ADR-0001: Favor A Thin Vertical Slice In v1

## Status

Accepted

## Context

The repository starts greenfield but the product target is broad: Attractor execution, Copilot orchestration, multi-repository observability, worktree isolation, artifact-backed handoffs, and a rich dashboard. Building for all future cases immediately would create a platform before validating one reliable user flow.

## Decision

For v1, optimize for one end-to-end flow:

- open repository
- create or import plan
- validate DOT
- run plan in one writable repo worktree
- observe progress in the dashboard
- resume, cancel, or retry

Preserve the v1.1 path through contract versioning and clear boundaries, not through large generalized abstractions.

## Consequences

### Positive

- faster time to first usable slice
- simpler contracts
- easier testing and debugging
- clearer UI and user mental model

### Negative

- some interfaces will evolve in v1.1
- advanced multi-repo and advanced Attractor nodes are intentionally deferred

## Follow-Up

- version all persisted contracts from day one
- keep transport and model access behind a single boundary
- delay public provider abstractions until a second implementation exists
