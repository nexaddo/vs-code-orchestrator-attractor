import { describe, it, expect } from "vitest";
import {
  buildOrchestratorSystemPrompt,
  buildOrchestratorUserMessage,
  buildPlannerSystemPrompt,
  buildPlannerUserMessage,
  buildImplementerSystemPrompt,
  buildImplementerUserMessage,
  buildReviewerSystemPrompt,
  buildReviewerUserMessage,
  type OrchestratorPromptContext,
  type PlannerPromptContext,
  type ImplementerPromptContext,
  type ReviewerPromptContext
} from "../../src/application/role-prompts";

describe("Orchestrator role prompts", () => {
  const context: OrchestratorPromptContext = {
    planTitle: "Add User Auth",
    planGoal: "Implement JWT-based authentication",
    milestones: [
      {
        id: "m1",
        title: "Setup auth module",
        order: 0,
        acceptanceCriteria: ["Auth service created", "Tests pass"]
      },
      {
        id: "m2",
        title: "Add login endpoint",
        order: 1,
        acceptanceCriteria: ["POST /login works", "Returns JWT"]
      }
    ]
  };

  it("buildOrchestratorSystemPrompt returns ModelMessage[] with role='system'", () => {
    const result = buildOrchestratorSystemPrompt(context);
    expect(result).toHaveLength(1);
    expect(result.at(0)?.role).toBe("system");
  });

  it("buildOrchestratorUserMessage returns ModelMessage[] with role='user'", () => {
    const result = buildOrchestratorUserMessage(context);
    expect(result).toHaveLength(1);
    expect(result.at(0)?.role).toBe("user");
  });

  it("buildOrchestratorSystemPrompt mentions orchestrator role", () => {
    const result = buildOrchestratorSystemPrompt(context);
    expect(result.at(0)?.content).toContain("orchestrator agent");
  });

  it("buildOrchestratorSystemPrompt mentions v1 node type constraints", () => {
    const result = buildOrchestratorSystemPrompt(context);
    expect(result.at(0)?.content).toContain(
      "start, exit, codergen, conditional, wait.human"
    );
  });

  it("buildOrchestratorUserMessage includes plan title and goal", () => {
    const result = buildOrchestratorUserMessage(context);
    expect(result.at(0)?.content).toContain("Add User Auth");
    expect(result.at(0)?.content).toContain("JWT-based authentication");
  });

  it("buildOrchestratorUserMessage includes milestone list with acceptance criteria", () => {
    const result = buildOrchestratorUserMessage(context);
    expect(result.at(0)?.content).toContain("Setup auth module");
    expect(result.at(0)?.content).toContain("Auth service created");
    expect(result.at(0)?.content).toContain("Add login endpoint");
    expect(result.at(0)?.content).toContain("Returns JWT");
  });

  it("buildOrchestratorSystemPrompt is deterministic", () => {
    const first = buildOrchestratorSystemPrompt(context);
    const second = buildOrchestratorSystemPrompt(context);
    expect(first).toEqual(second);
  });
});

describe("Planner role prompts", () => {
  const context: PlannerPromptContext = {
    milestoneName: "Setup auth module",
    milestoneId: "m1",
    description: "Create authentication service and tests",
    acceptanceCriteria: ["Auth service created", "Unit tests pass"],
    priorHandoffSummary: "Orchestrator approved milestone breakdown"
  };

  it("buildPlannerSystemPrompt returns ModelMessage[] with role='system'", () => {
    const result = buildPlannerSystemPrompt(context);
    expect(result).toHaveLength(1);
    expect(result.at(0)?.role).toBe("system");
  });

  it("buildPlannerUserMessage returns ModelMessage[] with role='user'", () => {
    const result = buildPlannerUserMessage(context);
    expect(result).toHaveLength(1);
    expect(result.at(0)?.role).toBe("user");
  });

  it("buildPlannerSystemPrompt mentions planner role", () => {
    const result = buildPlannerSystemPrompt(context);
    expect(result.at(0)?.content).toContain("planner agent");
  });

  it("buildPlannerUserMessage includes milestone name and acceptance criteria", () => {
    const result = buildPlannerUserMessage(context);
    expect(result.at(0)?.content).toContain("Setup auth module");
    expect(result.at(0)?.content).toContain("Auth service created");
    expect(result.at(0)?.content).toContain("Unit tests pass");
  });

  it("buildPlannerUserMessage includes prior handoff summary when provided", () => {
    const result = buildPlannerUserMessage(context);
    expect(result.at(0)?.content).toContain(
      "Orchestrator approved milestone breakdown"
    );
  });

  it("buildPlannerUserMessage omits prior handoff section when not provided", () => {
    const contextWithoutHandoff = {
      milestoneName: context.milestoneName,
      milestoneId: context.milestoneId,
      description: context.description,
      acceptanceCriteria: context.acceptanceCriteria
    };
    const result = buildPlannerUserMessage(contextWithoutHandoff);
    expect(result.at(0)?.content).not.toContain("Prior Context");
  });

  it("buildPlannerSystemPrompt is deterministic", () => {
    const first = buildPlannerSystemPrompt(context);
    const second = buildPlannerSystemPrompt(context);
    expect(first).toEqual(second);
  });
});

describe("Implementer role prompts", () => {
  const context: ImplementerPromptContext = {
    milestoneName: "Setup auth module",
    milestoneId: "m1",
    tasks: [
      { id: "t1", description: "Create AuthService class", testFirst: true },
      { id: "t2", description: "Implement JWT signing", testFirst: false }
    ],
    filesLikelyAffected: [
      "src/auth/AuthService.ts",
      "test/auth/AuthService.test.ts"
    ],
    priorHandoffSummary: "Planner generated 2 tasks"
  };

  it("buildImplementerSystemPrompt returns ModelMessage[] with role='system'", () => {
    const result = buildImplementerSystemPrompt(context);
    expect(result).toHaveLength(1);
    expect(result.at(0)?.role).toBe("system");
  });

  it("buildImplementerUserMessage returns ModelMessage[] with role='user'", () => {
    const result = buildImplementerUserMessage(context);
    expect(result).toHaveLength(1);
    expect(result.at(0)?.role).toBe("user");
  });

  it("buildImplementerSystemPrompt mentions implementer role", () => {
    const result = buildImplementerSystemPrompt(context);
    expect(result.at(0)?.content).toContain("implementer agent");
  });

  it("buildImplementerUserMessage includes task list with test-first indicators", () => {
    const result = buildImplementerUserMessage(context);
    expect(result.at(0)?.content).toContain("Create AuthService class");
    expect(result.at(0)?.content).toContain("TEST-FIRST");
    expect(result.at(0)?.content).toContain("Implement JWT signing");
    expect(result.at(0)?.content).toContain("DIRECT");
  });

  it("buildImplementerUserMessage includes files likely affected", () => {
    const result = buildImplementerUserMessage(context);
    expect(result.at(0)?.content).toContain("src/auth/AuthService.ts");
    expect(result.at(0)?.content).toContain("test/auth/AuthService.test.ts");
  });

  it("buildImplementerUserMessage includes prior handoff summary when provided", () => {
    const result = buildImplementerUserMessage(context);
    expect(result.at(0)?.content).toContain("Planner generated 2 tasks");
  });

  it("buildImplementerUserMessage omits prior handoff section when not provided", () => {
    const contextWithoutHandoff = {
      milestoneName: context.milestoneName,
      milestoneId: context.milestoneId,
      tasks: context.tasks,
      filesLikelyAffected: context.filesLikelyAffected
    };
    const result = buildImplementerUserMessage(contextWithoutHandoff);
    expect(result.at(0)?.content).not.toContain("Prior Context");
  });

  it("buildImplementerSystemPrompt is deterministic", () => {
    const first = buildImplementerSystemPrompt(context);
    const second = buildImplementerSystemPrompt(context);
    expect(first).toEqual(second);
  });
});

describe("Reviewer role prompts", () => {
  const context: ReviewerPromptContext = {
    milestoneName: "Setup auth module",
    milestoneId: "m1",
    tasksCompleted: ["Create AuthService class", "Implement JWT signing"],
    implementationSummary:
      "AuthService created with JWT support and full test coverage",
    testsPassed: true,
    priorHandoffSummary: "Implementer completed all tasks"
  };

  it("buildReviewerSystemPrompt returns ModelMessage[] with role='system'", () => {
    const result = buildReviewerSystemPrompt(context);
    expect(result).toHaveLength(1);
    expect(result.at(0)?.role).toBe("system");
  });

  it("buildReviewerUserMessage returns ModelMessage[] with role='user'", () => {
    const result = buildReviewerUserMessage(context);
    expect(result).toHaveLength(1);
    expect(result.at(0)?.role).toBe("user");
  });

  it("buildReviewerSystemPrompt mentions reviewer role", () => {
    const result = buildReviewerSystemPrompt(context);
    expect(result.at(0)?.content).toContain("reviewer agent");
  });

  it("buildReviewerUserMessage includes tasks completed and implementation summary", () => {
    const result = buildReviewerUserMessage(context);
    expect(result.at(0)?.content).toContain("Create AuthService class");
    expect(result.at(0)?.content).toContain("Implement JWT signing");
    expect(result.at(0)?.content).toContain(
      "AuthService created with JWT support"
    );
  });

  it("buildReviewerUserMessage includes test status", () => {
    const result = buildReviewerUserMessage(context);
    expect(result.at(0)?.content).toContain("Tests Passed: ✓");
  });

  it("buildReviewerUserMessage shows failed test status correctly", () => {
    const contextWithFailedTests: ReviewerPromptContext = {
      ...context,
      testsPassed: false
    };
    const result = buildReviewerUserMessage(contextWithFailedTests);
    expect(result.at(0)?.content).toContain("Tests Passed: ✗");
  });

  it("buildReviewerUserMessage includes prior handoff summary when provided", () => {
    const result = buildReviewerUserMessage(context);
    expect(result.at(0)?.content).toContain("Implementer completed all tasks");
  });

  it("buildReviewerUserMessage omits prior handoff section when not provided", () => {
    const contextWithoutHandoff = {
      milestoneName: context.milestoneName,
      milestoneId: context.milestoneId,
      tasksCompleted: context.tasksCompleted,
      implementationSummary: context.implementationSummary,
      testsPassed: context.testsPassed
    };
    const result = buildReviewerUserMessage(contextWithoutHandoff);
    expect(result.at(0)?.content).not.toContain("Prior Context");
  });

  it("buildReviewerSystemPrompt is deterministic", () => {
    const first = buildReviewerSystemPrompt(context);
    const second = buildReviewerSystemPrompt(context);
    expect(first).toEqual(second);
  });
});
