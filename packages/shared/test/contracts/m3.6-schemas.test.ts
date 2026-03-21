import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  ArtifactRecordSchema,
  HandoffEnvelopeSchema,
  MilestoneRunRecordSchema,
  OverviewStatePayloadSchema,
  RunStatePayloadSchema
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
