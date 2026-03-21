# Project Agent Rules

## Model Routing

- Treat the primary OpenCode agent as the Queen of the swarm. It reports directly to the user and orchestrates all subagents.
- Use `@ttd-orchestrator` for fast decomposition, dependency ordering, and slice planning.
- Use `@ttd-planner` for tight TTD loops, acceptance criteria, and failing-test design.
- Use `@ttd-implementer` for focused implementation iterations and small refactors.
- Use `@code-reviewer` for review loops, risk checks, and merge-readiness feedback.
- Use `@plan-drift-reviewer` at the end of each plan/implement/review/commit loop to compare implementation against the documented plan.

## Invocation Note

- `.opencode/agents/queen.md` defines the primary orchestration agent for OpenCode sessions.
- Start OpenCode with `--agent queen` when you want the full swarm workflow driven automatically.
- `@plan-drift-reviewer` is defined as an OpenCode subagent in `.opencode/agents/plan-drift-reviewer.md`.
- In OpenCode sessions, invoke it by mention as `@plan-drift-reviewer`.
- In this harness, the built-in Task tool only supports its fixed subagent types, so drift checks here should use `@code-reviewer` or `@ttd-planner` as the fallback reviewers for plan alignment.

## Preferred Models

- Orchestration and planning: GPT-5.4 via GitHub Copilot
- Focused implementation loops: Claude Haiku 4.5 via Anthropic
- Code review loops: Gemini 2.5 Pro via GitHub Copilot (primary), GPT-5.4 fallback
- Default portable project setup in this repo:
  - `@ttd-orchestrator` -> GPT-5.4 via GitHub Copilot
  - `@ttd-planner` -> GPT-5.4 via GitHub Copilot
  - `@ttd-implementer` -> Claude Haiku 4.5 via Anthropic
  - `@code-reviewer` -> Gemini 2.5 Pro via GitHub Copilot
  - `@code-reviewer-secondary` -> GPT-5.4 via GitHub Copilot
  - `@plan-drift-reviewer` -> Claude Sonnet 4.6 via Anthropic

## Working Rules

- Keep v1 scoped to one writable repository per plan.
- Treat attached context repositories as read-only.
- Keep prompts lean and use structured handoffs instead of full transcripts.
- Prefer `jcodemunch` for code reading, symbol discovery, file outlines, and targeted implementation context before falling back to raw file reads.
- Use direct file reads primarily for docs, config, fixtures, or when `jcodemunch` does not cover the needed file type/content.
- The Queen should autonomously invoke and coordinate subagents instead of doing direct implementation work where delegation is appropriate.
- Run a drift check before declaring a loop complete or branching to the next lane.
- Update `docs/architecture/model-routing.md` and `opencode.json` when model routing changes materially.
- If `@code-reviewer` returns empty or no substantive feedback, immediately rerun review with `@code-reviewer-secondary` and `@ttd-planner` as fallback reviewers.

## PR Review Protocol (MANDATORY — never skip)

Before merging any PR, the Queen MUST:

1. **Fetch ALL review comments** using `gh api repos/<owner>/<repo>/pulls/<number>/comments` and `gh api repos/<owner>/<repo>/pulls/<number>/reviews`. Retrieve every inline comment and review-level body.
2. **Triage every comment** — classify each as: (a) valid defect, (b) valid improvement, (c) debatable/low-priority, or (d) not applicable. No comment may be silently ignored.
3. **Respond to every comment** — post a reply on GitHub for each comment explaining: what was fixed (with commit SHA), why it was not fixed (with explicit rationale), or why it is deferred (with issue/tracker reference).
4. **Fix all High and Medium severity issues** before merging. Low severity may be deferred only with a documented reason in the reply.
5. **Verify fixes** — after implementing changes, re-run `pnpm typecheck && pnpm lint && pnpm test` to confirm all quality gates pass.
6. **Never auto-merge** a PR that has unread or unanswered Copilot review comments.

If a PR was already merged without completing these steps, create a follow-up cleanup issue or PR to address any unresolved High/Medium issues from the original review.
