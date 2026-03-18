import { describe, expect, it } from "vitest";

import {
  buildImplementerSystemPrompt,
  buildImplementerUserMessage,
  buildOrchestratorSystemPrompt,
  buildOrchestratorUserMessage,
  buildPlannerSystemPrompt,
  buildPlannerUserMessage,
  buildReviewerSystemPrompt,
  buildReviewerUserMessage
} from "../../src/application/role-prompts";
import type {
  GraphNode,
  OrchestratorHandoff,
  PlannerHandoff,
  ImplementerHandoff
} from "@attractor/shared";

const sampleNode: GraphNode = {
  id: "milestone-1",
  label: "Set up authentication module",
  dependsOn: []
};

const sampleNodeWithDeps: GraphNode = {
  id: "milestone-2",
  label: "Implement user dashboard",
  dependsOn: ["milestone-1"]
};

const sampleOrchestratorHandoff: OrchestratorHandoff = {
  version: 1,
  milestoneId: "milestone-1",
  milestoneName: "Set up authentication module",
  description:
    "Implement JWT-based authentication with login and logout flows.",
  acceptanceCriteria: [
    "User can log in with valid credentials",
    "Invalid credentials return 401",
    "JWT token expires after 1 hour"
  ]
};

const samplePlannerHandoff: PlannerHandoff = {
  version: 1,
  milestoneId: "milestone-1",
  tasks: [
    {
      id: "task-1",
      description: "Create User entity with password hashing",
      testFirst: true
    },
    { id: "task-2", description: "Implement login endpoint", testFirst: true }
  ],
  filesLikelyAffected: ["src/auth/user.ts", "src/auth/login.ts"]
};

const sampleImplementerHandoff: ImplementerHandoff = {
  version: 1,
  milestoneId: "milestone-1",
  tasksCompleted: ["task-1", "task-2"],
  summary: "Created User entity with bcrypt hashing and JWT login endpoint.",
  testsPassed: true
};

describe("orchestrator prompts", () => {
  it("system prompt instructs JSON-only response", () => {
    const prompt = buildOrchestratorSystemPrompt();
    expect(prompt).toContain("JSON");
    expect(prompt).toContain("acceptanceCriteria");
    expect(prompt).toContain("Do not include any text outside the JSON object");
  });

  it("user message includes milestone id and label", () => {
    const msg = buildOrchestratorUserMessage(sampleNode);
    expect(msg).toContain("milestone-1");
    expect(msg).toContain("Set up authentication module");
  });

  it("user message includes dependencies when present", () => {
    const msg = buildOrchestratorUserMessage(sampleNodeWithDeps);
    expect(msg).toContain("milestone-1");
    expect(msg).toContain("Depends on:");
  });

  it("user message omits dependency line when none", () => {
    const msg = buildOrchestratorUserMessage(sampleNode);
    expect(msg).not.toContain("Depends on:");
  });
});

describe("planner prompts", () => {
  it("system prompt instructs JSON-only response with tasks schema", () => {
    const prompt = buildPlannerSystemPrompt();
    expect(prompt).toContain("JSON");
    expect(prompt).toContain("tasks");
    expect(prompt).toContain("testFirst");
    expect(prompt).toContain("filesLikelyAffected");
  });

  it("user message includes orchestrator handoff JSON", () => {
    const msg = buildPlannerUserMessage(sampleOrchestratorHandoff);
    expect(msg).toContain("milestone-1");
    expect(msg).toContain("Set up authentication module");
    expect(msg).toContain("acceptanceCriteria");
  });
});

describe("implementer prompts", () => {
  it("system prompt includes worktree path", () => {
    const prompt = buildImplementerSystemPrompt(
      "/tmp/attractor-worktrees/run-abc"
    );
    expect(prompt).toContain("/tmp/attractor-worktrees/run-abc");
    expect(prompt).toContain("TDD");
    expect(prompt).toContain("testsPassed");
  });

  it("user message includes planner handoff JSON", () => {
    const msg = buildImplementerUserMessage(samplePlannerHandoff);
    expect(msg).toContain("milestone-1");
    expect(msg).toContain("task-1");
    expect(msg).toContain("testFirst");
  });
});

describe("reviewer prompts", () => {
  it("system prompt instructs JSON-only response with approved field", () => {
    const prompt = buildReviewerSystemPrompt();
    expect(prompt).toContain("JSON");
    expect(prompt).toContain("approved");
    expect(prompt).toContain("requiresChanges");
    expect(prompt).toContain("comments");
  });

  it("user message includes implementer handoff JSON", () => {
    const msg = buildReviewerUserMessage(sampleImplementerHandoff);
    expect(msg).toContain("milestone-1");
    expect(msg).toContain("task-1");
    expect(msg).toContain("testsPassed");
  });
});
