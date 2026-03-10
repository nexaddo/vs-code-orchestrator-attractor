# Project Agent Rules

## Model Routing

- Use `@ttd-orchestrator` for fast decomposition, dependency ordering, and slice planning.
- Use `@ttd-planner` for tight TTD loops, acceptance criteria, and failing-test design.
- Use `@ttd-implementer` for focused implementation iterations and small refactors.
- Use `@code-reviewer` for review loops, risk checks, and merge-readiness feedback.

## Preferred Models

- Orchestration and planning: GPT-5.4 via GitHub Copilot
- Focused implementation loops: Claude Haiku 4.5 via Anthropic
- Code review loops: Claude Sonnet 4.6
- Default portable project setup in this repo:
  - `@ttd-orchestrator` -> GPT-5.4 via GitHub Copilot
  - `@ttd-planner` -> GPT-5.4 via GitHub Copilot
  - `@ttd-implementer` -> Claude Haiku 4.5 via Anthropic
  - `@code-reviewer` -> Claude Sonnet 4.6 via Anthropic
  - `@code-reviewer-secondary` -> GPT-5.4 via GitHub Copilot

## Working Rules

- Keep v1 scoped to one writable repository per plan.
- Treat attached context repositories as read-only.
- Keep prompts lean and use structured handoffs instead of full transcripts.
- Update `docs/architecture/model-routing.md` and `opencode.json` when model routing changes materially.
