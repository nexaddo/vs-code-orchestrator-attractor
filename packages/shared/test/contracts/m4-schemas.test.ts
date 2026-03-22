import { describe, expect, it } from "vitest";

import {
  AgentRolePhaseSchema,
  AgentRoleStatusSchema,
  ImplementerHandoffSchema,
  OrchestrationStatePayloadSchema,
  OrchestratorHandoffSchema,
  PlannerHandoffSchema,
  ReviewerHandoffSchema
} from "../../src/contracts";

// ── AgentRoleStatusSchema ─────────────────────────────────────────────────────

describe("AgentRoleStatusSchema", () => {
  it.each(["done", "running", "waiting", "failed", "skipped"] as const)(
    "accepts '%s'",
    (status) => {
      expect(AgentRoleStatusSchema.parse(status)).toBe(status);
    }
  );

  it("rejects an invalid status", () => {
    const result = AgentRoleStatusSchema.safeParse("completed");

    expect(result.success).toBe(false);
  });
});

// ── AgentRolePhaseSchema ──────────────────────────────────────────────────────

describe("AgentRolePhaseSchema", () => {
  it("accepts a minimal phase with role and status only", () => {
    const parsed = AgentRolePhaseSchema.parse({
      role: "orchestrator",
      status: "running"
    });

    expect(parsed.role).toBe("orchestrator");
    expect(parsed.status).toBe("running");
    expect(parsed.taskSummary).toBeUndefined();
    expect(parsed.errorLabel).toBeUndefined();
  });

  it("accepts a phase with all optional fields", () => {
    const parsed = AgentRolePhaseSchema.parse({
      role: "implementer",
      status: "failed",
      taskSummary: "Implementing auth module",
      errorLabel: "CompilationError"
    });

    expect(parsed.taskSummary).toBe("Implementing auth module");
    expect(parsed.errorLabel).toBe("CompilationError");
  });

  it("rejects a phase with an invalid role", () => {
    const result = AgentRolePhaseSchema.safeParse({
      role: "manager",
      status: "running"
    });

    expect(result.success).toBe(false);
  });

  it("rejects a phase with an invalid status", () => {
    const result = AgentRolePhaseSchema.safeParse({
      role: "planner",
      status: "pending"
    });

    expect(result.success).toBe(false);
  });

  it("survives a json round trip", () => {
    const input = {
      role: "reviewer",
      status: "done",
      taskSummary: "Code review complete"
    };
    const parsed = AgentRolePhaseSchema.parse(input);
    const roundTripped = JSON.parse(JSON.stringify(parsed)) as unknown;

    expect(AgentRolePhaseSchema.parse(roundTripped)).toEqual(parsed);
  });
});

// ── OrchestrationStatePayloadSchema ───────────────────────────────────────────

describe("OrchestrationStatePayloadSchema", () => {
  const validPayload = {
    runId: "run_001",
    milestoneIndex: 0,
    milestoneCount: 3,
    milestoneName: "Auth Setup",
    phases: [
      { role: "orchestrator", status: "done" },
      { role: "planner", status: "running" },
      { role: "implementer", status: "waiting" },
      { role: "reviewer", status: "waiting" }
    ] as const
  };

  it("accepts a valid orchestration state payload", () => {
    const parsed = OrchestrationStatePayloadSchema.parse(validPayload);

    expect(parsed.runId).toBe("run_001");
    expect(parsed.milestoneIndex).toBe(0);
    expect(parsed.milestoneCount).toBe(3);
    expect(parsed.milestoneName).toBe("Auth Setup");
    expect(parsed.phases).toHaveLength(4);
    expect(parsed.phases[0].role).toBe("orchestrator");
    expect(parsed.phases[1].status).toBe("running");
  });

  it("accepts a payload with phase summaries and errors", () => {
    const parsed = OrchestrationStatePayloadSchema.parse({
      ...validPayload,
      phases: [
        { role: "orchestrator", status: "done", taskSummary: "Decomposed" },
        { role: "planner", status: "done", taskSummary: "Planned 3 tasks" },
        {
          role: "implementer",
          status: "failed",
          errorLabel: "TypeCheckFailed"
        },
        { role: "reviewer", status: "skipped" }
      ]
    });

    expect(parsed.phases[2].errorLabel).toBe("TypeCheckFailed");
    expect(parsed.phases[3].status).toBe("skipped");
  });

  it("rejects a payload with fewer than 4 phases", () => {
    const result = OrchestrationStatePayloadSchema.safeParse({
      ...validPayload,
      phases: [
        { role: "orchestrator", status: "done" },
        { role: "planner", status: "running" }
      ]
    });

    expect(result.success).toBe(false);
  });

  it("rejects a payload with more than 4 phases", () => {
    const result = OrchestrationStatePayloadSchema.safeParse({
      ...validPayload,
      phases: [
        { role: "orchestrator", status: "done" },
        { role: "planner", status: "running" },
        { role: "implementer", status: "waiting" },
        { role: "reviewer", status: "waiting" },
        { role: "orchestrator", status: "waiting" }
      ]
    });

    expect(result.success).toBe(false);
  });

  it("rejects a payload with milestoneCount less than 1", () => {
    const result = OrchestrationStatePayloadSchema.safeParse({
      ...validPayload,
      milestoneCount: 0
    });

    expect(result.success).toBe(false);
  });

  it("rejects a payload with negative milestoneIndex", () => {
    const result = OrchestrationStatePayloadSchema.safeParse({
      ...validPayload,
      milestoneIndex: -1
    });

    expect(result.success).toBe(false);
  });

  it("rejects a payload missing runId", () => {
    const result = OrchestrationStatePayloadSchema.safeParse({
      milestoneIndex: validPayload.milestoneIndex,
      milestoneCount: validPayload.milestoneCount,
      milestoneName: validPayload.milestoneName,
      phases: validPayload.phases
    });

    expect(result.success).toBe(false);
  });

  it("survives a json round trip", () => {
    const parsed = OrchestrationStatePayloadSchema.parse(validPayload);
    const roundTripped = JSON.parse(JSON.stringify(parsed)) as unknown;

    expect(OrchestrationStatePayloadSchema.parse(roundTripped)).toEqual(parsed);
  });
});

// ── OrchestratorHandoffSchema ─────────────────────────────────────────────────

describe("OrchestratorHandoffSchema", () => {
  const validHandoff = {
    version: 1,
    milestoneId: "ms_001",
    milestoneName: "Auth Setup",
    description: "Implement JWT authentication flow",
    acceptanceCriteria: ["Login endpoint returns JWT", "Token expires in 1h"]
  };

  it("accepts a valid orchestrator handoff", () => {
    const parsed = OrchestratorHandoffSchema.parse(validHandoff);

    expect(parsed.milestoneId).toBe("ms_001");
    expect(parsed.milestoneName).toBe("Auth Setup");
    expect(parsed.acceptanceCriteria).toHaveLength(2);
  });

  it("accepts an orchestrator handoff with empty acceptance criteria", () => {
    const parsed = OrchestratorHandoffSchema.parse({
      ...validHandoff,
      acceptanceCriteria: []
    });

    expect(parsed.acceptanceCriteria).toHaveLength(0);
  });

  it("rejects a handoff missing description", () => {
    const result = OrchestratorHandoffSchema.safeParse({
      version: 1,
      milestoneId: "ms_001",
      milestoneName: "Auth Setup",
      acceptanceCriteria: ["Login endpoint returns JWT"]
    });

    expect(result.success).toBe(false);
  });

  it("rejects a handoff with wrong version", () => {
    const result = OrchestratorHandoffSchema.safeParse({
      ...validHandoff,
      version: 2
    });

    expect(result.success).toBe(false);
  });

  it("survives a json round trip", () => {
    const parsed = OrchestratorHandoffSchema.parse(validHandoff);
    const roundTripped = JSON.parse(JSON.stringify(parsed)) as unknown;

    expect(OrchestratorHandoffSchema.parse(roundTripped)).toEqual(parsed);
  });
});

// ── PlannerHandoffSchema ──────────────────────────────────────────────────────

describe("PlannerHandoffSchema", () => {
  const validHandoff = {
    version: 1,
    milestoneId: "ms_001",
    tasks: [
      { id: "task_1", description: "Create auth middleware", testFirst: true },
      { id: "task_2", description: "Add login route", testFirst: false }
    ],
    filesLikelyAffected: ["src/auth/middleware.ts", "src/routes/login.ts"]
  };

  it("accepts a valid planner handoff", () => {
    const parsed = PlannerHandoffSchema.parse(validHandoff);

    expect(parsed.milestoneId).toBe("ms_001");
    expect(parsed.tasks).toHaveLength(2);
    expect(parsed.tasks[0]?.testFirst).toBe(true);
    expect(parsed.filesLikelyAffected).toHaveLength(2);
  });

  it("accepts a planner handoff with empty tasks and files", () => {
    const parsed = PlannerHandoffSchema.parse({
      ...validHandoff,
      tasks: [],
      filesLikelyAffected: []
    });

    expect(parsed.tasks).toHaveLength(0);
    expect(parsed.filesLikelyAffected).toHaveLength(0);
  });

  it("rejects a task missing description", () => {
    const result = PlannerHandoffSchema.safeParse({
      ...validHandoff,
      tasks: [{ id: "task_1", testFirst: true }]
    });

    expect(result.success).toBe(false);
  });

  it("rejects a task missing testFirst boolean", () => {
    const result = PlannerHandoffSchema.safeParse({
      ...validHandoff,
      tasks: [{ id: "task_1", description: "Do something" }]
    });

    expect(result.success).toBe(false);
  });

  it("survives a json round trip", () => {
    const parsed = PlannerHandoffSchema.parse(validHandoff);
    const roundTripped = JSON.parse(JSON.stringify(parsed)) as unknown;

    expect(PlannerHandoffSchema.parse(roundTripped)).toEqual(parsed);
  });
});

// ── ImplementerHandoffSchema ──────────────────────────────────────────────────

describe("ImplementerHandoffSchema", () => {
  const validHandoff = {
    version: 1,
    milestoneId: "ms_001",
    tasksCompleted: ["task_1", "task_2"],
    summary: "Implemented auth middleware and login route",
    testsPassed: true
  };

  it("accepts a valid implementer handoff", () => {
    const parsed = ImplementerHandoffSchema.parse(validHandoff);

    expect(parsed.milestoneId).toBe("ms_001");
    expect(parsed.tasksCompleted).toHaveLength(2);
    expect(parsed.summary).toContain("auth middleware");
    expect(parsed.testsPassed).toBe(true);
  });

  it("accepts a handoff with no tasks completed and tests failed", () => {
    const parsed = ImplementerHandoffSchema.parse({
      ...validHandoff,
      tasksCompleted: [],
      summary: "Partial implementation — blocked by config issue",
      testsPassed: false
    });

    expect(parsed.tasksCompleted).toHaveLength(0);
    expect(parsed.testsPassed).toBe(false);
  });

  it("rejects a handoff missing summary", () => {
    const result = ImplementerHandoffSchema.safeParse({
      version: 1,
      milestoneId: "ms_001",
      tasksCompleted: ["task_1"],
      testsPassed: true
    });

    expect(result.success).toBe(false);
  });

  it("rejects a handoff with empty summary", () => {
    const result = ImplementerHandoffSchema.safeParse({
      ...validHandoff,
      summary: ""
    });

    expect(result.success).toBe(false);
  });

  it("survives a json round trip", () => {
    const parsed = ImplementerHandoffSchema.parse(validHandoff);
    const roundTripped = JSON.parse(JSON.stringify(parsed)) as unknown;

    expect(ImplementerHandoffSchema.parse(roundTripped)).toEqual(parsed);
  });
});

// ── ReviewerHandoffSchema ─────────────────────────────────────────────────────

describe("ReviewerHandoffSchema", () => {
  const validHandoff = {
    version: 1,
    milestoneId: "ms_001",
    approved: true,
    comments: ["Clean implementation", "Good test coverage"],
    requiresChanges: false
  };

  it("accepts a valid approved reviewer handoff", () => {
    const parsed = ReviewerHandoffSchema.parse(validHandoff);

    expect(parsed.milestoneId).toBe("ms_001");
    expect(parsed.approved).toBe(true);
    expect(parsed.comments).toHaveLength(2);
    expect(parsed.requiresChanges).toBe(false);
  });

  it("accepts a reviewer handoff that requires changes", () => {
    const parsed = ReviewerHandoffSchema.parse({
      ...validHandoff,
      approved: false,
      comments: ["Missing error handling in auth flow"],
      requiresChanges: true
    });

    expect(parsed.approved).toBe(false);
    expect(parsed.requiresChanges).toBe(true);
  });

  it("accepts a reviewer handoff with empty comments", () => {
    const parsed = ReviewerHandoffSchema.parse({
      ...validHandoff,
      comments: []
    });

    expect(parsed.comments).toHaveLength(0);
  });

  it("rejects a handoff missing approved field", () => {
    const result = ReviewerHandoffSchema.safeParse({
      version: 1,
      milestoneId: "ms_001",
      comments: [],
      requiresChanges: false
    });

    expect(result.success).toBe(false);
  });

  it("rejects a handoff with wrong version", () => {
    const result = ReviewerHandoffSchema.safeParse({
      ...validHandoff,
      version: 99
    });

    expect(result.success).toBe(false);
  });

  it("survives a json round trip", () => {
    const parsed = ReviewerHandoffSchema.parse(validHandoff);
    const roundTripped = JSON.parse(JSON.stringify(parsed)) as unknown;

    expect(ReviewerHandoffSchema.parse(roundTripped)).toEqual(parsed);
  });
});
