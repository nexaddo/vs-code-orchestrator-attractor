# Project Agent Rules

## Model Routing

- Use `@ttd-orchestrator` for fast decomposition, dependency ordering, and slice planning.
- Use `@ttd-planner` for tight TTD loops, acceptance criteria, and failing-test design.
- Use `@ttd-implementer` for focused implementation iterations and small refactors.
- Use `@code-reviewer` for review loops, risk checks, and merge-readiness feedback.
- Use `@plan-drift-reviewer` at the end of each plan/implement/review/commit loop to compare implementation against the documented plan.

## Invocation Note

- `@plan-drift-reviewer` is defined as an OpenCode subagent in `.opencode/agents/plan-drift-reviewer.md`.
- In OpenCode sessions, invoke it by mention as `@plan-drift-reviewer`.
- In this harness, the built-in Task tool only supports its fixed subagent types, so drift checks here should use `@code-reviewer` or `@ttd-planner` as the fallback reviewers for plan alignment.

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
  - `@plan-drift-reviewer` -> Claude Sonnet 4.6 via Anthropic

## Working Rules

- Keep v1 scoped to one writable repository per plan.
- Treat attached context repositories as read-only.
- Keep prompts lean and use structured handoffs instead of full transcripts.
- Run a drift check before declaring a loop complete or branching to the next lane.
- Update `docs/architecture/model-routing.md` and `opencode.json` when model routing changes materially.
