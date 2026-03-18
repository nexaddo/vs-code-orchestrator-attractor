import type {
  GraphNode,
  OrchestratorHandoff,
  PlannerHandoff,
  ImplementerHandoff
} from "@attractor/shared";

export function buildOrchestratorSystemPrompt(): string {
  return `You are the orchestrator agent for a coding workflow called Attractor.
Your job: analyze a milestone from a software development plan and produce a structured breakdown.
Respond ONLY with valid JSON matching this schema:
{
  "version": 1,
  "milestoneId": "<string>",
  "milestoneName": "<string>",
  "description": "<string: 1-3 sentences about what this milestone accomplishes>",
  "acceptanceCriteria": ["<string>"] // 2-5 concrete, testable criteria
}
Do not include any text outside the JSON object.`;
}

export function buildOrchestratorUserMessage(node: GraphNode): string {
  const deps =
    node.dependsOn.length > 0
      ? `\nDepends on: ${node.dependsOn.join(", ")}`
      : "";
  return `Analyze this milestone and produce the structured breakdown:\n\nMilestone ID: ${node.id}\nMilestone name: ${node.label}${deps}`;
}

export function buildPlannerSystemPrompt(): string {
  return `You are the planner agent for a coding workflow called Attractor.
Your job: given an orchestrator's milestone breakdown, produce a concrete task list.
Each task should be small enough to complete in one TDD cycle (write failing test → make it pass → refactor).
Respond ONLY with valid JSON matching this schema:
{
  "version": 1,
  "milestoneId": "<string>",
  "tasks": [{ "id": "<string>", "description": "<string>", "testFirst": true }],
  "filesLikelyAffected": ["<file path>"]
}
Do not include any text outside the JSON object.`;
}

export function buildPlannerUserMessage(
  orchestratorHandoff: OrchestratorHandoff
): string {
  return `Given this milestone breakdown, produce a task list:\n\n${JSON.stringify(orchestratorHandoff, null, 2)}`;
}

export function buildImplementerSystemPrompt(worktreePath: string): string {
  return `You are the implementer agent for a coding workflow called Attractor.
Your worktree is located at: ${worktreePath}
Your job: given a task list, describe what implementation you performed using TDD.
Respond ONLY with valid JSON matching this schema:
{
  "version": 1,
  "milestoneId": "<string>",
  "tasksCompleted": ["<task id>"],
  "summary": "<string: what was implemented>",
  "testsPassed": true
}
Do not include any text outside the JSON object.`;
}

export function buildImplementerUserMessage(
  plannerHandoff: PlannerHandoff
): string {
  return `Execute these tasks using TDD:\n\n${JSON.stringify(plannerHandoff, null, 2)}`;
}

export function buildReviewerSystemPrompt(): string {
  return `You are the reviewer agent for a coding workflow called Attractor.
Your job: evaluate an implementation summary and decide whether to approve it.
Respond ONLY with valid JSON matching this schema:
{
  "version": 1,
  "milestoneId": "<string>",
  "approved": true,
  "comments": ["<string>"],
  "requiresChanges": false
}
Do not include any text outside the JSON object.`;
}

export function buildReviewerUserMessage(
  implementerHandoff: ImplementerHandoff
): string {
  return `Review this implementation:\n\n${JSON.stringify(implementerHandoff, null, 2)}`;
}
