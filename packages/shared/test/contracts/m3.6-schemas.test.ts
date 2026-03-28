import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  ArtifactRecordSchema,
  GraphUpdatePayloadSchema,
  HandoffEnvelopeSchema,
  MilestoneRunRecordSchema,
  OverviewStatePayloadSchema,
  PlanStatePayloadSchema,
  RepositoryStatePayloadSchema,
  RunStatePayloadSchema,
  ToastPayloadSchema
} from "../../src/contracts";

const fixturesDir = path.resolve(
  __dirname,
  "../../../../test/fixtures/contracts"
);

const loadFixture = (relativePath: string): unknown => {
  const fullPath = path.join(fixturesDir, relativePath);
  return JSON.parse(readFileSync(fullPath, "utf8")) as unknown;
};

// ── MilestoneRunRecordSchema ──────────────────────────────────────────────────

describe("MilestoneRunRecordSchema", () => {
  it("accepts a minimal succeeded milestone run", () => {
    const parsed = MilestoneRunRecordSchema.parse(
      loadFixture("milestone-runs/valid/minimal.json")
    );

    expect(parsed.id).toBe("mr_001");
    expect(parsed.runId).toBe("run_001");
    expect(parsed.milestoneId).toBe("ms_001");
    expect(parsed.status).toBe("succeeded");
    expect(parsed.endedAt).toBe("2026-03-16T01:05:00Z");
  });

  it("accepts a failed milestone run with an error message", () => {
    const parsed = MilestoneRunRecordSchema.parse(
      loadFixture("milestone-runs/valid/with-error.json")
    );

    expect(parsed.status).toBe("failed");
    expect(parsed.errorMessage).toBe(
      "Condition branch 'approve' not satisfied"
    );
  });

  it("accepts a running milestone run without endedAt", () => {
    const parsed = MilestoneRunRecordSchema.parse(
      loadFixture("milestone-runs/valid/running.json")
    );

    expect(parsed.status).toBe("running");
    expect(parsed.endedAt).toBeUndefined();
  });

  it("rejects a milestone run missing runId", () => {
    const result = MilestoneRunRecordSchema.safeParse(
      loadFixture("milestone-runs/invalid/missing-run-id.json")
    );

    expect(result.success).toBe(false);
  });

  it("rejects a milestone run with an invalid status", () => {
    const result = MilestoneRunRecordSchema.safeParse(
      loadFixture("milestone-runs/invalid/bad-status.json")
    );

    expect(result.success).toBe(false);
  });

  it("survives a json round trip", () => {
    const fixture = loadFixture("milestone-runs/valid/minimal.json");
    const parsed = MilestoneRunRecordSchema.parse(fixture);
    const roundTripped = JSON.parse(JSON.stringify(parsed)) as unknown;

    expect(MilestoneRunRecordSchema.parse(roundTripped)).toEqual(parsed);
  });
});

// ── ArtifactRecordSchema ──────────────────────────────────────────────────────

describe("ArtifactRecordSchema", () => {
  it("accepts a minimal artifact with nodeId and milestoneId", () => {
    const parsed = ArtifactRecordSchema.parse(
      loadFixture("artifacts/valid/minimal.json")
    );

    expect(parsed.id).toBe("art_001");
    expect(parsed.type).toBe("task-pack");
    expect(parsed.nodeId).toBe("codergen_1");
    expect(parsed.milestoneId).toBe("ms_001");
  });

  it("accepts an artifact without nodeId or milestoneId", () => {
    const parsed = ArtifactRecordSchema.parse(
      loadFixture("artifacts/valid/without-node.json")
    );

    expect(parsed.id).toBe("art_002");
    expect(parsed.type).toBe("log");
    expect(parsed.nodeId).toBeUndefined();
    expect(parsed.milestoneId).toBeUndefined();
  });

  it("rejects an artifact missing title", () => {
    const result = ArtifactRecordSchema.safeParse(
      loadFixture("artifacts/invalid/missing-title.json")
    );

    expect(result.success).toBe(false);
  });

  it("rejects an artifact with an invalid type", () => {
    const result = ArtifactRecordSchema.safeParse(
      loadFixture("artifacts/invalid/bad-type.json")
    );

    expect(result.success).toBe(false);
  });

  it("survives a json round trip", () => {
    const fixture = loadFixture("artifacts/valid/minimal.json");
    const parsed = ArtifactRecordSchema.parse(fixture);
    const roundTripped = JSON.parse(JSON.stringify(parsed)) as unknown;

    expect(ArtifactRecordSchema.parse(roundTripped)).toEqual(parsed);
  });
});

// ── HandoffEnvelopeSchema ─────────────────────────────────────────────────────

describe("HandoffEnvelopeSchema", () => {
  it("accepts a minimal handoff with context", () => {
    const parsed = HandoffEnvelopeSchema.parse(
      loadFixture("handoffs/valid/minimal.json")
    );

    expect(parsed.id).toBe("hoff_001");
    expect(parsed.fromRole).toBe("planner");
    expect(parsed.toRole).toBe("implementer");
    expect(parsed.task).toContain("JWT");
    expect(parsed.context).toBeDefined();
  });

  it("accepts a handoff without optional context", () => {
    const parsed = HandoffEnvelopeSchema.parse(
      loadFixture("handoffs/valid/without-context.json")
    );

    expect(parsed.id).toBe("hoff_002");
    expect(parsed.fromRole).toBe("implementer");
    expect(parsed.toRole).toBe("reviewer");
    expect(parsed.context).toBeUndefined();
  });

  it("rejects a handoff missing task", () => {
    const result = HandoffEnvelopeSchema.safeParse(
      loadFixture("handoffs/invalid/missing-task.json")
    );

    expect(result.success).toBe(false);
  });

  it("rejects a handoff with an invalid role", () => {
    const result = HandoffEnvelopeSchema.safeParse(
      loadFixture("handoffs/invalid/bad-role.json")
    );

    expect(result.success).toBe(false);
  });

  it("survives a json round trip", () => {
    const fixture = loadFixture("handoffs/valid/minimal.json");
    const parsed = HandoffEnvelopeSchema.parse(fixture);
    const roundTripped = JSON.parse(JSON.stringify(parsed)) as unknown;

    expect(HandoffEnvelopeSchema.parse(roundTripped)).toEqual(parsed);
  });
});

// ── Payload schemas ───────────────────────────────────────────────────────────

describe("OverviewStatePayloadSchema", () => {
  it("accepts a valid empty overview payload", () => {
    const parsed = OverviewStatePayloadSchema.parse({
      repositories: [],
      activeRuns: [],
      recentFailures: [],
      stats: {
        totalRepos: 0,
        totalPlans: 0,
        activeRuns: 0,
        pausedRuns: 0,
        failedRuns24h: 0
      }
    });

    expect(parsed.repositories).toHaveLength(0);
    expect(parsed.stats.totalRepos).toBe(0);
  });

  it("rejects an overview payload missing stats", () => {
    const result = OverviewStatePayloadSchema.safeParse({
      repositories: [],
      activeRuns: [],
      recentFailures: []
    });

    expect(result.success).toBe(false);
  });
});

describe("RunStatePayloadSchema", () => {
  it("accepts a valid run state payload without currentHandoff", () => {
    const run = {
      version: 1,
      id: "run_001",
      planId: "plan_001",
      status: "running",
      attempt: 1,
      createdAt: "2026-03-16T01:00:00Z",
      updatedAt: "2026-03-16T01:00:00Z"
    };

    const plan = {
      version: 1,
      id: "plan_001",
      title: "Auth Feature",
      goal: "Implement authentication",
      status: "running",
      repositories: [
        {
          repositoryId: "repo_001",
          role: "executable",
          access: "read_write",
          mountAlias: "main"
        }
      ],
      primaryExecutableRepositoryId: "repo_001",
      graphSource: "digraph { start -> exit }",
      createdAt: "2026-03-16T00:00:00Z",
      updatedAt: "2026-03-16T01:00:00Z"
    };

    const parsed = RunStatePayloadSchema.parse({
      run,
      plan,
      milestoneRuns: [],
      artifacts: []
    });

    expect(parsed.run.id).toBe("run_001");
    expect(parsed.currentHandoff).toBeUndefined();
  });
});

// ── RepositoryStatePayloadSchema ──────────────────────────────────────────────

describe("RepositoryStatePayloadSchema", () => {
  const repo = {
    version: 1,
    id: "repo_001",
    name: "my-app",
    rootUri: "/workspace/my-app",
    defaultBranch: "main",
    labels: []
  };

  it("accepts a valid repository state payload with empty collections", () => {
    const parsed = RepositoryStatePayloadSchema.parse({
      repository: repo,
      plans: [],
      runs: [],
      activity: []
    });

    expect(parsed.repository.id).toBe("repo_001");
    expect(parsed.plans).toHaveLength(0);
    expect(parsed.runs).toHaveLength(0);
    expect(parsed.activity).toHaveLength(0);
  });

  it("rejects a payload missing the repository field", () => {
    const result = RepositoryStatePayloadSchema.safeParse({
      plans: [],
      runs: [],
      activity: []
    });

    expect(result.success).toBe(false);
  });

  it("rejects a payload with an invalid repository (missing defaultBranch)", () => {
    const result = RepositoryStatePayloadSchema.safeParse({
      repository: { ...repo, defaultBranch: undefined },
      plans: [],
      runs: [],
      activity: []
    });

    expect(result.success).toBe(false);
  });
});

// ── PlanStatePayloadSchema ────────────────────────────────────────────────────

describe("PlanStatePayloadSchema", () => {
  const plan = {
    version: 1,
    id: "plan_001",
    title: "Auth Feature",
    goal: "Implement authentication",
    status: "ready",
    repositories: [
      {
        repositoryId: "repo_001",
        role: "executable",
        access: "read_write",
        mountAlias: "main"
      }
    ],
    primaryExecutableRepositoryId: "repo_001",
    graphSource: "digraph { start -> exit }",
    createdAt: "2026-03-16T00:00:00Z",
    updatedAt: "2026-03-16T00:00:00Z"
  };

  it("accepts a valid plan state payload with empty collections", () => {
    const parsed = PlanStatePayloadSchema.parse({
      plan,
      milestones: [],
      history: [],
      validationEvents: []
    });

    expect(parsed.plan.id).toBe("plan_001");
    expect(parsed.milestones).toHaveLength(0);
    expect(parsed.history).toHaveLength(0);
    expect(parsed.validationEvents).toHaveLength(0);
  });

  it("rejects a payload missing the plan field", () => {
    const result = PlanStatePayloadSchema.safeParse({
      milestones: [],
      history: [],
      validationEvents: []
    });

    expect(result.success).toBe(false);
  });

  it("rejects a payload with an invalid plan status", () => {
    const result = PlanStatePayloadSchema.safeParse({
      plan: { ...plan, status: "unknown_status" },
      milestones: [],
      history: [],
      validationEvents: []
    });

    expect(result.success).toBe(false);
  });
});

// ── GraphUpdatePayloadSchema ──────────────────────────────────────────────────

describe("GraphUpdatePayloadSchema", () => {
  it("accepts a valid graph update payload", () => {
    const parsed = GraphUpdatePayloadSchema.parse({
      nodeId: "codergen_1",
      status: "running"
    });

    expect(parsed.nodeId).toBe("codergen_1");
    expect(parsed.status).toBe("running");
  });

  it("accepts all valid node statuses", () => {
    const statuses = [
      "queued",
      "running",
      "blocked",
      "failed",
      "succeeded",
      "canceled"
    ] as const;

    for (const status of statuses) {
      const result = GraphUpdatePayloadSchema.safeParse({
        nodeId: "node_1",
        status
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects a payload with an invalid status", () => {
    const result = GraphUpdatePayloadSchema.safeParse({
      nodeId: "node_1",
      status: "completed"
    });

    expect(result.success).toBe(false);
  });

  it("rejects a payload missing nodeId", () => {
    const result = GraphUpdatePayloadSchema.safeParse({ status: "running" });

    expect(result.success).toBe(false);
  });
});

// ── ToastPayloadSchema ────────────────────────────────────────────────────────

describe("ToastPayloadSchema", () => {
  it("accepts a valid info toast with no actions", () => {
    const parsed = ToastPayloadSchema.parse({
      message: "Plan saved successfully",
      severity: "info",
      actions: []
    });

    expect(parsed.message).toBe("Plan saved successfully");
    expect(parsed.severity).toBe("info");
    expect(parsed.actions).toHaveLength(0);
  });

  it("accepts a warning toast with actions", () => {
    const parsed = ToastPayloadSchema.parse({
      message: "Validation warning",
      severity: "warning",
      actions: ["Dismiss", "View Details"]
    });

    expect(parsed.severity).toBe("warning");
    expect(parsed.actions).toEqual(["Dismiss", "View Details"]);
  });

  it("accepts an error toast", () => {
    const parsed = ToastPayloadSchema.parse({
      message: "Run failed unexpectedly",
      severity: "error",
      actions: ["Retry"]
    });

    expect(parsed.severity).toBe("error");
  });

  it("rejects a toast with an invalid severity", () => {
    const result = ToastPayloadSchema.safeParse({
      message: "Something happened",
      severity: "debug",
      actions: []
    });

    expect(result.success).toBe(false);
  });

  it("rejects a toast missing message", () => {
    const result = ToastPayloadSchema.safeParse({
      severity: "info",
      actions: []
    });

    expect(result.success).toBe(false);
  });
});
