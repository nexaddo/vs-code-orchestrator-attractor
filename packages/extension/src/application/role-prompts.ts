import type { ModelMessage } from "./ports";

/**
 * Context for orchestrator role prompts.
 */
export interface OrchestratorPromptContext {
  planTitle: string;
  planGoal: string;
  currentMilestoneId: string;
  currentMilestoneName: string;
  milestones: {
    id: string;
    title: string;
    order: number;
    acceptanceCriteria: string[];
  }[];
}

/**
 * Context for planner role prompts.
 */
export interface PlannerPromptContext {
  milestoneName: string;
  milestoneId: string;
  description: string;
  acceptanceCriteria: string[];
  priorHandoffSummary?: string;
}

/**
 * Context for implementer role prompts.
 */
export interface ImplementerPromptContext {
  milestoneName: string;
  milestoneId: string;
  tasks: {
    id: string;
    description: string;
    testFirst: boolean;
  }[];
  filesLikelyAffected: string[];
  priorHandoffSummary?: string;
}

/**
 * Context for reviewer role prompts.
 */
export interface ReviewerPromptContext {
  milestoneName: string;
  milestoneId: string;
  tasksCompleted: string[];
  implementationSummary: string;
  testsPassed: boolean;
  priorHandoffSummary?: string;
}

/**
 * Build system prompt for orchestrator role.
 */
export function buildOrchestratorSystemPrompt(
  context: OrchestratorPromptContext
): ModelMessage[] {
  void context;
  return [
    {
      role: "system",
      content: `You are the orchestrator agent for the VS Code Attractor extension.

Your role is to coordinate multi-agent execution across milestones, ensuring each handoff is clean and well-scoped.

## v1 Constraints

- Node types: start, exit, codergen, conditional, wait.human
- One writable repository per plan
- Additional read-only context repositories allowed
- Deferred to v1.1: parallel, fan_in, tool, manager_loop

## Expected Output

Return structured handoffs in JSON format with:
- milestoneId: string
- milestoneName: string
- description: string
- acceptanceCriteria: string[]

Ensure each milestone handoff is atomic and testable.`
    }
  ];
}

/**
 * Build user message for orchestrator role.
 */
export function buildOrchestratorUserMessage(
  context: OrchestratorPromptContext
): ModelMessage[] {
  const milestoneList = context.milestones
    .map(
      (m) =>
        `${m.order + 1}. ${m.title} (ID: ${m.id})\n   Acceptance Criteria:\n${m.acceptanceCriteria.map((c) => `   - ${c}`).join("\n")}`
    )
    .join("\n\n");

  return [
    {
      role: "user",
      content: `Plan: ${context.planTitle}

Goal: ${context.planGoal}

Current Milestone To Plan: ${context.currentMilestoneName} (ID: ${context.currentMilestoneId})

Milestones:
${milestoneList}

Generate handoffs for the next milestone in sequence.`
    }
  ];
}

/**
 * Build system prompt for planner role.
 */
export function buildPlannerSystemPrompt(
  context: PlannerPromptContext
): ModelMessage[] {
  void context;
  return [
    {
      role: "system",
      content: `You are the planner agent for the VS Code Attractor extension.

Your role is to decompose milestone goals into discrete, testable tasks with clear file scope.

## v1 Constraints

- Node types: start, exit, codergen, conditional, wait.human
- One writable repository per plan
- Additional read-only context repositories allowed

## Expected Output

Return structured task lists in JSON format with:
- milestoneId: string
- tasks: Array<{ id: string; description: string; testFirst: boolean }>
- filesLikelyAffected: string[]

Ensure tasks are atomic, ordered by dependency, and test-first where applicable.`
    }
  ];
}

/**
 * Build user message for planner role.
 */
export function buildPlannerUserMessage(
  context: PlannerPromptContext
): ModelMessage[] {
  const criteriaList = context.acceptanceCriteria
    .map((c, i) => `${i + 1}. ${c}`)
    .join("\n");

  const priorHandoff = context.priorHandoffSummary
    ? `\n\nPrior Context:\n${context.priorHandoffSummary}`
    : "";

  return [
    {
      role: "user",
      content: `Milestone: ${context.milestoneName} (ID: ${context.milestoneId})

Description: ${context.description}

Acceptance Criteria:
${criteriaList}${priorHandoff}

Generate a task plan for this milestone.`
    }
  ];
}

/**
 * Build system prompt for implementer role.
 */
export function buildImplementerSystemPrompt(
  context: ImplementerPromptContext
): ModelMessage[] {
  void context;
  return [
    {
      role: "system",
      content: `You are the implementer agent for the VS Code Attractor extension.

Your role is to execute task plans, write tests first where specified, and deliver working implementations.

## v1 Constraints

- Node types: start, exit, codergen, conditional, wait.human
- One writable repository per plan
- Additional read-only context repositories allowed

## Expected Output

Return structured implementation summaries in JSON format with:
- milestoneId: string
- tasksCompleted: string[]
- summary: string
- testsPassed: boolean

Ensure all test-first tasks have passing tests before marking complete.`
    }
  ];
}

/**
 * Build user message for implementer role.
 */
export function buildImplementerUserMessage(
  context: ImplementerPromptContext
): ModelMessage[] {
  const taskList = context.tasks
    .map(
      (t, i) =>
        `${i + 1}. [${t.testFirst ? "TEST-FIRST" : "DIRECT"}] ${t.description} (ID: ${t.id})`
    )
    .join("\n");

  const filesList = context.filesLikelyAffected.map((f) => `- ${f}`).join("\n");

  const priorHandoff = context.priorHandoffSummary
    ? `\n\nPrior Context:\n${context.priorHandoffSummary}`
    : "";

  return [
    {
      role: "user",
      content: `Milestone: ${context.milestoneName} (ID: ${context.milestoneId})

Tasks:
${taskList}

Files Likely Affected:
${filesList}${priorHandoff}

Execute the task plan and report completion status.`
    }
  ];
}

/**
 * Build system prompt for reviewer role.
 */
export function buildReviewerSystemPrompt(
  context: ReviewerPromptContext
): ModelMessage[] {
  void context;
  return [
    {
      role: "system",
      content: `You are the reviewer agent for the VS Code Attractor extension.

Your role is to validate implementations against acceptance criteria, identify issues, and approve or request changes.

## v1 Constraints

- Node types: start, exit, codergen, conditional, wait.human
- One writable repository per plan
- Additional read-only context repositories allowed

## Expected Output

Return structured review results in JSON format with:
- milestoneId: string
- approved: boolean
- comments: string[]
- requiresChanges: boolean

Ensure all acceptance criteria are met before approving.`
    }
  ];
}

/**
 * Build user message for reviewer role.
 */
export function buildReviewerUserMessage(
  context: ReviewerPromptContext
): ModelMessage[] {
  const tasksList = context.tasksCompleted
    .map((t, i) => `${i + 1}. ${t}`)
    .join("\n");

  const priorHandoff = context.priorHandoffSummary
    ? `\n\nPrior Context:\n${context.priorHandoffSummary}`
    : "";

  return [
    {
      role: "user",
      content: `Milestone: ${context.milestoneName} (ID: ${context.milestoneId})

Tasks Completed:
${tasksList}

Implementation Summary:
${context.implementationSummary}

Tests Passed: ${context.testsPassed ? "✓" : "✗"}${priorHandoff}

Review this implementation and provide approval or change requests.`
    }
  ];
}
