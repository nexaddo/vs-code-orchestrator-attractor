import { describe, expect, it } from "vitest";

import { buildPlanViewModel } from "../../src/plan/PlanSurface";
import type { PlanState } from "../../src/plan/model";

function makeState(overrides?: Partial<PlanState>): PlanState {
  const base: PlanState = {
    plan: {
      version: 1,
      id: "plan-001",
      title: "Ship M3.9 Slice 7",
      goal: "Render a real plan dashboard surface",
      status: "ready",
      repositories: [
        {
          repositoryId: "repo-main",
          role: "executable",
          access: "read_write",
          mountAlias: "main"
        },
        {
          repositoryId: "repo-docs",
          role: "context",
          access: "read_only",
          mountAlias: "docs",
          ref: "origin/main"
        }
      ],
      primaryExecutableRepositoryId: "repo-main",
      graphSource: "graph/plan.dot",
      createdAt: "2026-03-01T00:00:00Z",
      updatedAt: "2026-03-02T00:00:00Z"
    },
    milestones: [
      {
        version: 1,
        id: "m-2",
        planId: "plan-001",
        title: "Render header",
        order: 2,
        status: "pending",
        acceptanceCriteria: ["show title", "show status"],
        nodeIds: []
      },
      {
        version: 1,
        id: "m-1",
        planId: "plan-001",
        title: "Build view model",
        order: 1,
        status: "completed",
        acceptanceCriteria: ["status mapping"],
        nodeIds: []
      }
    ],
    history: [
      {
        version: 1,
        id: "run-100",
        planId: "plan-001",
        status: "paused",
        attempt: 2,
        createdAt: "2026-03-03T00:00:00Z",
        updatedAt: "2026-03-03T01:00:00Z"
      }
    ],
    validationEvents: [
      {
        version: 1,
        id: "evt-1",
        entityType: "run",
        entityId: "run-100",
        kind: "validation.failed",
        timestamp: "2026-03-03T00:30:00Z",
        payload: {
          message: "Acceptance criteria mismatch"
        }
      }
    ]
  };

  return {
    ...base,
    ...overrides
  };
}

describe("buildPlanViewModel", () => {
  it("builds populated view model with plan/run/event mappings", () => {
    const vm = buildPlanViewModel(makeState());

    expect(vm.title).toBe("Ship M3.9 Slice 7");
    expect(vm.status).toBe("queued");
    expect(vm.repositories).toHaveLength(2);
    expect(vm.history).toEqual([
      {
        id: "run-100",
        status: "blocked",
        attempt: 2,
        createdAt: "2026-03-03T00:00:00Z"
      }
    ]);
    expect(vm.validationEvents).toEqual([
      {
        id: "evt-1",
        kind: "validation.failed",
        timestamp: "2026-03-03T00:30:00Z",
        level: "error",
        message: "Acceptance criteria mismatch"
      }
    ]);
  });

  it("builds empty arrays and zero progress for empty state", () => {
    const vm = buildPlanViewModel(
      makeState({ milestones: [], history: [], validationEvents: [] })
    );

    expect(vm.milestones).toEqual([]);
    expect(vm.history).toEqual([]);
    expect(vm.validationEvents).toEqual([]);
    expect(vm.milestoneProgress).toEqual({ current: 0, total: 0 });
  });

  it("maps milestone statuses to status badge vocabulary", () => {
    const vm = buildPlanViewModel(
      makeState({
        milestones: [
          {
            version: 1,
            id: "m-pending",
            planId: "plan-001",
            title: "Pending",
            order: 1,
            status: "pending",
            acceptanceCriteria: [],
            nodeIds: []
          },
          {
            version: 1,
            id: "m-ready",
            planId: "plan-001",
            title: "Ready",
            order: 2,
            status: "ready",
            acceptanceCriteria: [],
            nodeIds: []
          },
          {
            version: 1,
            id: "m-paused",
            planId: "plan-001",
            title: "Paused",
            order: 3,
            status: "paused",
            acceptanceCriteria: [],
            nodeIds: []
          },
          {
            version: 1,
            id: "m-completed",
            planId: "plan-001",
            title: "Completed",
            order: 4,
            status: "completed",
            acceptanceCriteria: [],
            nodeIds: []
          },
          {
            version: 1,
            id: "m-failed",
            planId: "plan-001",
            title: "Failed",
            order: 5,
            status: "failed",
            acceptanceCriteria: [],
            nodeIds: []
          }
        ]
      })
    );

    expect(vm.milestones.map((milestone) => milestone.status)).toEqual([
      "queued",
      "queued",
      "blocked",
      "succeeded",
      "failed"
    ]);
  });

  it("calculates milestone progress from completed milestones", () => {
    const vm = buildPlanViewModel(
      makeState({
        milestones: [
          {
            version: 1,
            id: "m-1",
            planId: "plan-001",
            title: "One",
            order: 1,
            status: "completed",
            acceptanceCriteria: [],
            nodeIds: []
          },
          {
            version: 1,
            id: "m-2",
            planId: "plan-001",
            title: "Two",
            order: 2,
            status: "running",
            acceptanceCriteria: [],
            nodeIds: []
          },
          {
            version: 1,
            id: "m-3",
            planId: "plan-001",
            title: "Three",
            order: 3,
            status: "completed",
            acceptanceCriteria: [],
            nodeIds: []
          }
        ]
      })
    );

    expect(vm.milestoneProgress).toEqual({ current: 2, total: 3 });
  });
});
