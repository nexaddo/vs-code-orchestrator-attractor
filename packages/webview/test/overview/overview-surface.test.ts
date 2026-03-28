import { describe, expect, it } from "vitest";

import {
  OverviewSurface,
  buildOverviewViewModel
} from "../../src/overview/OverviewSurface";
import type { OverviewState } from "../../src/overview/model";

describe("OverviewSurface", () => {
  it("exports a surface component", () => {
    expect(typeof OverviewSurface).toBe("function");
  });

  it("builds summary metrics and list view models", () => {
    const state: OverviewState = {
      repositories: [
        {
          version: 1,
          id: "repo-alpha",
          name: "repo-alpha",
          rootUri: "file:///workspace/repo-alpha",
          defaultBranch: "main",
          labels: []
        },
        {
          version: 1,
          id: "repo-docs",
          name: "repo-docs",
          rootUri: "file:///workspace/repo-docs",
          defaultBranch: "develop",
          labels: []
        }
      ],
      activeRuns: [
        {
          version: 1,
          id: "run-001",
          planId: "plan-001",
          status: "running",
          attempt: 1,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:01:00Z"
        },
        {
          version: 1,
          id: "run-002",
          planId: "plan-002",
          status: "paused",
          attempt: 1,
          createdAt: "2025-01-02T00:00:00Z",
          updatedAt: "2025-01-02T00:02:00Z"
        }
      ],
      recentFailures: [
        {
          version: 1,
          id: "run-003",
          planId: "plan-003",
          status: "failed",
          attempt: 2,
          createdAt: "2025-01-03T00:00:00Z",
          updatedAt: "2025-01-03T00:03:00Z"
        }
      ],
      stats: {
        totalRepos: 2,
        totalPlans: 3,
        activeRuns: 2,
        pausedRuns: 1,
        failedRuns24h: 1
      }
    };

    const vm = buildOverviewViewModel(state);

    expect(vm.metrics).toEqual([
      { key: "repositories", label: "Repositories", value: 2 },
      { key: "plans", label: "Plans", value: 3 },
      { key: "active-runs", label: "Active Runs", value: 2 },
      { key: "paused", label: "Paused", value: 1 },
      { key: "failed-24h", label: "Failed 24h", value: 1, isFailure: true }
    ]);
    expect(vm.repositories).toHaveLength(2);
    expect(vm.repositories[1].defaultBranch).toBe("develop");
    expect(vm.activeRuns).toEqual([
      { id: "run-001", planId: "plan-001", status: "running" },
      { id: "run-002", planId: "plan-002", status: "blocked" }
    ]);
    expect(vm.recentFailures).toEqual([
      { id: "run-003", planId: "plan-003", status: "failed" }
    ]);
  });

  it("builds empty view models when state arrays are empty", () => {
    const state: OverviewState = {
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
    };

    const vm = buildOverviewViewModel(state);

    expect(vm.repositories).toEqual([]);
    expect(vm.activeRuns).toEqual([]);
    expect(vm.recentFailures).toEqual([]);
    expect(vm.metrics.map((m) => m.value)).toEqual([0, 0, 0, 0, 0]);
  });

  it("accepts optional error field in OverviewState", () => {
    const stateWithError: OverviewState = {
      repositories: [],
      activeRuns: [],
      recentFailures: [],
      stats: {
        totalRepos: 0,
        totalPlans: 0,
        activeRuns: 0,
        pausedRuns: 0,
        failedRuns24h: 0
      },
      error: "Extension activation failed: No workspace open"
    };

    expect(stateWithError.error).toBe(
      "Extension activation failed: No workspace open"
    );
  });

  it("builds view model when state has error field", () => {
    const state: OverviewState = {
      repositories: [],
      activeRuns: [],
      recentFailures: [],
      stats: {
        totalRepos: 0,
        totalPlans: 0,
        activeRuns: 0,
        pausedRuns: 0,
        failedRuns24h: 0
      },
      error: "Extension activation failed: No workspace open"
    };

    const vm = buildOverviewViewModel(state);

    expect(vm.metrics).toHaveLength(5);
    expect(vm.repositories).toEqual([]);
  });
});
