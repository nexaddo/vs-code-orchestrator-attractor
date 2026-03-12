# Model Routing

## Purpose

This document records the preferred model routing for implementation work in this repository so future iterations stay fast and consistent.

## Primary Agent

- `queen`: `github-copilot/gpt-5.4`

The Queen is the primary OpenCode agent for this repository. It orchestrates the swarm, delegates implementation to subagents, watches CI and PR state, and uses drift review before closing loops.

## Current Routing

### Orchestration And Planning

- `ttd-orchestrator`: `github-copilot/gpt-5.4`
- `ttd-planner`: `github-copilot/gpt-5.4`

Use the highest-signal planning model for decomposition, dependency ordering, and tight TTD loop design.

### Focused Implementation

- `ttd-implementer`: `anthropic/claude-haiku-4-5`

Use a faster implementation model for small, focused red-green-refactor iterations.

### Review Loops

- `code-reviewer`: `github-copilot/gemini-2.5-pro`
- `code-reviewer-secondary`: `github-copilot/gpt-5.4`
- `plan-drift-reviewer`: `anthropic/claude-sonnet-4-6`

Use a higher-quality model for code review, design risk checks, and merge-readiness passes.

## Notes

- `github-copilot/gpt-5.4` is the preferred orchestration and planning model for this project.
- `anthropic/claude-haiku-4-5` is the preferred implementation model for tight TTD loops.
- GitHub Copilot Gemini 2.5 Pro is the primary review model (switched from Sonnet 4.6 due to repeated empty responses).
- Claude Sonnet 4.6 via Anthropic powers the dedicated drift-review pass at the end of each loop.
- GPT-5.4 provides a secondary independent review opinion when a second pass is useful.
- If the primary reviewer returns empty or no substantive feedback, immediately rerun review with the secondary reviewer and planner as fallback reviewers.

## Update Policy

Update this file and `opencode.json` when:

- a model repeatedly underperforms for its assigned role
- a cheaper model proves equally reliable for a role
- a new provider becomes the preferred review model
- agent routing changes materially for v1 or v1.1

## OpenCode Runtime Note

- `plan-drift-reviewer` is a valid OpenCode subagent and appears in `opencode agent list`.
- Subagents are not invokable through `opencode run --agent <name>` because `run --agent` expects a primary agent.
- Invoke the drift reviewer inside OpenCode by mention as `@plan-drift-reviewer`, or let a primary agent delegate to it.
- In external harnesses that only expose fixed subagent types, use the primary reviewer or planner as the fallback drift-check mechanism.
