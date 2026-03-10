# Model Routing

## Purpose

This document records the preferred model routing for implementation work in this repository so future iterations stay fast and consistent.

## Current Routing

### Orchestration And Planning

- `ttd-orchestrator`: `github-copilot/gpt-5.4`
- `ttd-planner`: `github-copilot/gpt-5.4`

Use the highest-signal planning model for decomposition, dependency ordering, and tight TTD loop design.

### Focused Implementation

- `ttd-implementer`: `anthropic/claude-haiku-4-5`

Use a faster implementation model for small, focused red-green-refactor iterations.

### Review Loops

- `code-reviewer`: `anthropic/claude-sonnet-4-6`
- `code-reviewer-secondary`: `github-copilot/gpt-5.4`

Use a higher-quality model for code review, design risk checks, and merge-readiness passes.

## Notes

- `github-copilot/gpt-5.4` is the preferred orchestration and planning model for this project.
- `anthropic/claude-haiku-4-5` is the preferred implementation model for tight TTD loops.
- Sonnet 4.6 remains the primary review model.
- GPT-5.4 provides a secondary independent review opinion when a second pass is useful.
- If a configured provider uses a slightly different Sonnet 4.6 model ID, keep the routing intent the same and update this file to match the provider-specific identifier.

## Update Policy

Update this file and `opencode.json` when:

- a model repeatedly underperforms for its assigned role
- a cheaper model proves equally reliable for a role
- a new provider becomes the preferred review model
- agent routing changes materially for v1 or v1.1
