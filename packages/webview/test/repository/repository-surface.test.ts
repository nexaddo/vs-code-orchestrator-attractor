import { describe, expect, it } from "vitest";

import {
  RepositorySurface,
  buildRepositoryViewModel
} from "../../src/repository/RepositorySurface";
import type { RepositoryState } from "../../src/repository/model";

describe("RepositorySurface", () => {
  it("exports a surface component", () => {
    expect(typeof RepositorySurface).toBe("function");
  });

  it("builds repository, plan, run, and activity view models", () => {
    const state: RepositoryState = {
      repository: {
        version: 1,
        id: "repo-1",
        name: "attractor",
        rootUri: "file:///workspace/attractor",
        defaultBranch: "main",
        labels: ["core", "backend"]
      },
      plans: [
        {
          version: 1,
          id: "plan-draft",
          title: "Draft Plan",
          goal: "Draft things",
          status: "draft",
          repositories: [
            {
              repositoryId: "repo-1",
              role: "executable",
              access: "read_write",
              mountAlias: "workspace"
            }
          ],
          primaryExecutableRepositoryId: "repo-1",
          graphSource: "graph TD; A-->B",
          createdAt: "2026-01-10T00:00:00Z",
          updatedAt: "2026-01-11T00:00:00Z"
        },
        {
          version: 1,
          id: "plan-completed",
          title: "Completed Plan",
          goal: "Complete things",
          status: "completed",
          repositories: [
            {
              repositoryId: "repo-1",
              role: "executable",
              access: "read_write",
              mountAlias: "workspace"
            }
          ],
          primaryExecutableRepositoryId: "repo-1",
          graphSource: "graph TD; C-->D",
          createdAt: "2026-01-12T00:00:00Z",
          updatedAt: "2026-01-13T00:00:00Z"
        },
        {
          version: 1,
          id: "plan-paused",
          title: "Paused Plan",
          goal: "Pause things",
          status: "paused",
          repositories: [
            {
              repositoryId: "repo-1",
              role: "executable",
              access: "read_write",
              mountAlias: "workspace"
            }
          ],
          primaryExecutableRepositoryId: "repo-1",
          graphSource: "graph TD; E-->F",
          createdAt: "2026-01-14T00:00:00Z",
          updatedAt: "2026-01-15T00:00:00Z"
        }
      ],
      runs: [
        {
          version: 1,
          id: "run-1",
          planId: "plan-draft",
          status: "queued",
          attempt: 1,
          createdAt: "2026-01-20T00:00:00Z",
          updatedAt: "2026-01-20T00:01:00Z"
        },
        {
          version: 1,
          id: "run-2",
          planId: "plan-completed",
          status: "completed",
          attempt: 2,
          createdAt: "2026-01-21T00:00:00Z",
          updatedAt: "2026-01-21T00:02:00Z"
        },
        {
          version: 1,
          id: "run-3",
          planId: "plan-paused",
          status: "paused",
          attempt: 1,
          createdAt: "2026-01-22T00:00:00Z",
          updatedAt: "2026-01-22T00:03:00Z"
        }
      ],
      activity: [
        {
          version: 1,
          id: "evt-1",
          entityType: "plan",
          entityId: "plan-draft",
          kind: "created",
          timestamp: "2026-01-20T10:00:00Z",
          payload: {}
        },
        {
          version: 1,
          id: "evt-2",
          entityType: "run",
          entityId: "run-3",
          kind: "status.changed",
          timestamp: "2026-01-20T10:05:00Z",
          payload: {}
        },
        {
          version: 1,
          id: "evt-3",
          entityType: "run",
          entityId: "run-2",
          kind: "error",
          timestamp: "2026-01-20T10:10:00Z",
          payload: {}
        }
      ]
    };

    const vm = buildRepositoryViewModel(state);

    expect(vm.name).toBe("attractor");
    expect(vm.defaultBranch).toBe("main");
    expect(vm.labels).toEqual(["core", "backend"]);
    expect(vm.plans).toEqual([
      {
        id: "plan-draft",
        title: "Draft Plan",
        status: "queued",
        updatedAt: "2026-01-11T00:00:00Z"
      },
      {
        id: "plan-completed",
        title: "Completed Plan",
        status: "succeeded",
        updatedAt: "2026-01-13T00:00:00Z"
      },
      {
        id: "plan-paused",
        title: "Paused Plan",
        status: "blocked",
        updatedAt: "2026-01-15T00:00:00Z"
      }
    ]);
    expect(vm.runs).toEqual([
      {
        id: "run-1",
        planId: "plan-draft",
        status: "queued",
        attempt: 1,
        createdAt: "2026-01-20T00:00:00Z"
      },
      {
        id: "run-2",
        planId: "plan-completed",
        status: "succeeded",
        attempt: 2,
        createdAt: "2026-01-21T00:00:00Z"
      },
      {
        id: "run-3",
        planId: "plan-paused",
        status: "blocked",
        attempt: 1,
        createdAt: "2026-01-22T00:00:00Z"
      }
    ]);
    expect(vm.activity).toEqual([
      {
        id: "evt-1",
        level: "info",
        timestamp: "2026-01-20T10:00:00Z",
        text: "created · plan"
      },
      {
        id: "evt-2",
        level: "warn",
        timestamp: "2026-01-20T10:05:00Z",
        text: "status.changed · run"
      },
      {
        id: "evt-3",
        level: "error",
        timestamp: "2026-01-20T10:10:00Z",
        text: "error · run"
      }
    ]);
  });

  it("builds empty list view models when plans, runs, and activity are empty", () => {
    const state: RepositoryState = {
      repository: {
        version: 1,
        id: "repo-1",
        name: "attractor",
        rootUri: "file:///workspace/attractor",
        defaultBranch: "main",
        labels: []
      },
      plans: [],
      runs: [],
      activity: []
    };

    const vm = buildRepositoryViewModel(state);

    expect(vm.plans).toEqual([]);
    expect(vm.runs).toEqual([]);
    expect(vm.activity).toEqual([]);
    expect(vm.labels).toEqual([]);
  });
});
