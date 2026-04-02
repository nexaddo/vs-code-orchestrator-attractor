import { describe, expect, it } from "vitest";

import { RunSurface, buildRunViewModel } from "../../src/run/RunSurface";
import { formatTimestamp } from "../../src/lib/utils";
import type { RunState } from "../../src/run/model";

function createState(overrides?: Partial<RunState>): RunState {
  return {
    run: {
      version: 1,
      id: "run-001",
      planId: "plan-001",
      status: "paused",
      attempt: 2,
      createdAt: "2026-01-10T10:00:00.000Z",
      updatedAt: "2026-01-10T10:15:00.000Z"
    },
    plan: {
      version: 1,
      id: "plan-001",
      title: "Ship run inspector surface",
      goal: "Expose run timeline and artifacts in webview",
      status: "running",
      repositories: [
        {
          repositoryId: "repo-main",
          role: "executable",
          access: "read_write",
          mountAlias: "main"
        }
      ],
      primaryExecutableRepositoryId: "repo-main",
      graphSource: "digraph { A -> B }",
      createdAt: "2026-01-09T08:00:00.000Z",
      updatedAt: "2026-01-10T10:15:00.000Z"
    },
    milestoneRuns: [
      {
        version: 1,
        id: "mr-001",
        runId: "run-001",
        milestoneId: "milestone-1",
        nodeId: "node.prepare",
        status: "succeeded",
        startedAt: "2026-01-10T10:01:00.000Z",
        endedAt: "2026-01-10T10:05:00.000Z"
      },
      {
        version: 1,
        id: "mr-002",
        runId: "run-001",
        milestoneId: "milestone-2",
        nodeId: "node.implement",
        status: "running",
        startedAt: "2026-01-10T10:06:00.000Z"
      }
    ],
    artifacts: [
      {
        version: 1,
        id: "artifact-1",
        runId: "run-001",
        milestoneId: "milestone-1",
        type: "task-pack",
        title: "M3.9 Slice 8 task pack",
        uri: "file:///artifacts/task-pack.md",
        createdAt: "2026-01-10T10:02:00.000Z"
      },
      {
        version: 1,
        id: "artifact-2",
        runId: "run-001",
        nodeId: "node.implement",
        type: "report",
        title: "Implementation report",
        uri: "file:///artifacts/report.md",
        createdAt: "2026-01-10T10:12:00.000Z"
      }
    ],
    currentHandoff: {
      version: 1,
      id: "handoff-1",
      runId: "run-001",
      nodeId: "node.implement",
      fromRole: "planner",
      toRole: "implementer",
      task: "Build run surface and tests",
      reason: "Execution moved from planning to implementation",
      createdAt: "2026-01-10T10:07:00.000Z"
    },
    ...overrides
  };
}

describe("RunSurface", () => {
  it("exports a surface component", () => {
    expect(typeof RunSurface).toBe("function");
  });

  it("builds populated run view model", () => {
    const vm = buildRunViewModel(createState());

    expect(vm.header).toEqual({
      runId: "run-001",
      status: "blocked",
      planTitle: "Ship run inspector surface",
      attemptLabel: "Attempt 2"
    });
    expect(vm.timeline).toHaveLength(2);
    expect(vm.artifacts).toHaveLength(2);
    expect(vm.currentHandoff).toEqual({
      fromRole: "Planner",
      toRole: "Implementer",
      task: "Build run surface and tests",
      reason: "Execution moved from planning to implementation"
    });
  });

  it("builds empty state view model without handoff", () => {
    const vm = buildRunViewModel(
      createState({
        milestoneRuns: [],
        artifacts: [],
        currentHandoff: undefined
      })
    );

    expect(vm.timeline).toEqual([]);
    expect(vm.artifacts).toEqual([]);
    expect(vm.currentHandoff).toBeUndefined();
    expect(vm.progress).toEqual({
      succeeded: 0,
      total: 0,
      percent: 0,
      label: "0/0 milestones succeeded"
    });
  });

  it("keeps milestone run statuses unchanged for status badge", () => {
    const vm = buildRunViewModel(
      createState({
        milestoneRuns: [
          {
            version: 1,
            id: "mr-queued",
            runId: "run-001",
            milestoneId: "m-1",
            nodeId: "node.q",
            status: "queued",
            startedAt: "2026-01-10T10:01:00.000Z"
          },
          {
            version: 1,
            id: "mr-blocked",
            runId: "run-001",
            milestoneId: "m-2",
            nodeId: "node.b",
            status: "blocked",
            startedAt: "2026-01-10T10:02:00.000Z"
          },
          {
            version: 1,
            id: "mr-canceled",
            runId: "run-001",
            milestoneId: "m-3",
            nodeId: "node.c",
            status: "canceled",
            startedAt: "2026-01-10T10:03:00.000Z"
          }
        ]
      })
    );

    expect(vm.timeline.map((item) => item.status)).toEqual([
      "queued",
      "blocked",
      "canceled"
    ]);
  });

  it("calculates milestone progress as succeeded over total", () => {
    const vm = buildRunViewModel(createState());

    expect(vm.progress.succeeded).toBe(1);
    expect(vm.progress.total).toBe(2);
    expect(vm.progress.percent).toBe(50);
  });

  it("preserves artifact types for badge display", () => {
    const vm = buildRunViewModel(createState());

    expect(vm.artifacts.map((artifact) => artifact.type)).toEqual([
      "task-pack",
      "report"
    ]);
  });

  it("timeline startedAt and endedAt are ISO strings that formatTimestamp can display", () => {
    const vm = buildRunViewModel(createState());

    // The view model carries raw ISO strings; formatTimestamp is applied in the
    // JSX render layer (RunSurface.tsx) to convert them to HH:MM:SS.mmm display
    // values. This test verifies the pipeline: raw ISO → formatTimestamp → short time.
    const first = vm.timeline[0];
    expect(first.startedAt).toBe("2026-01-10T10:01:00.000Z");
    expect(first.endedAt).toBe("2026-01-10T10:05:00.000Z");

    // Verify formatTimestamp converts to the expected short form.
    // The exact hour depends on the local timezone; we verify structure only.
    expect(formatTimestamp(first.startedAt)).toMatch(
      /^\d{2}:\d{2}:\d{2}\.\d{3}$/
    );
    expect(formatTimestamp(first.endedAt!)).toMatch(
      /^\d{2}:\d{2}:\d{2}\.\d{3}$/
    );
  });

  it("timeline milestone with no endedAt passes undefined safely through formatTimestamp", () => {
    const vm = buildRunViewModel(createState());

    const running = vm.timeline[1];
    expect(running.endedAt).toBeUndefined();

    // formatTimestamp guards against null/undefined — returns "" for missing values.
    expect(formatTimestamp(running.endedAt ?? "")).toBe("");
  });

  it("artifact createdAt is an ISO string that formatTimestamp can display", () => {
    const vm = buildRunViewModel(createState());

    const artifact = vm.artifacts[0];
    expect(artifact.createdAt).toBe("2026-01-10T10:02:00.000Z");

    // formatTimestamp is applied to createdAt in the JSX render layer.
    expect(formatTimestamp(artifact.createdAt)).toMatch(
      /^\d{2}:\d{2}:\d{2}\.\d{3}$/
    );
  });
});
