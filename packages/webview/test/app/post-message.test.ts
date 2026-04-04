import { beforeEach, describe, expect, it } from "vitest";

import {
  cancelRun,
  createPlan,
  focusGraphNode,
  openMilestone,
  openPlan,
  openRepository,
  openRun,
  resumeRun,
  retryRun,
  runPlan
} from "../../src/app/postMessage";

describe("postMessage helpers", () => {
  let posted: unknown[];

  beforeEach(() => {
    posted = [];
    (
      globalThis as unknown as {
        acquireVsCodeApi: () => { postMessage: (msg: unknown) => void };
      }
    ).acquireVsCodeApi = () => ({
      postMessage: (msg: unknown) => {
        posted.push(msg);
      }
    });
  });

  it("openRepository sends repository.open shape", () => {
    openRepository("r1");

    expect(posted).toHaveLength(1);
    expect(posted[0]).toMatchObject({
      version: 1,
      type: "repository.open",
      payload: { repositoryId: "r1" }
    });
    expect((posted[0] as { requestId: unknown }).requestId).toEqual(
      expect.any(String)
    );
  });

  it("openMilestone sends milestone.open shape", () => {
    openMilestone("p1");

    expect(posted[0]).toMatchObject({
      version: 1,
      type: "milestone.open",
      payload: { planId: "p1" }
    });
  });

  it("focusGraphNode sends graph.focus shape", () => {
    focusGraphNode("n1", "running");

    expect(posted[0]).toMatchObject({
      version: 1,
      type: "graph.focus",
      payload: { nodeId: "n1", status: "running" }
    });
  });

  it("createPlan sends plan.create shape", () => {
    createPlan("repo-1", "Title", "Goal");

    expect(posted[0]).toMatchObject({
      version: 1,
      type: "plan.create",
      payload: { repositoryId: "repo-1", title: "Title", goal: "Goal" }
    });
  });

  it("runPlan sends plan.run shape", () => {
    runPlan("p1");

    expect(posted[0]).toMatchObject({
      version: 1,
      type: "plan.run",
      payload: { planId: "p1" }
    });
  });

  it("resumeRun sends run.resume shape", () => {
    resumeRun("run-1");

    expect(posted[0]).toMatchObject({
      version: 1,
      type: "run.resume",
      payload: { runId: "run-1" }
    });
  });

  it("cancelRun sends run.cancel shape", () => {
    cancelRun("run-2");

    expect(posted[0]).toMatchObject({
      version: 1,
      type: "run.cancel",
      payload: { runId: "run-2" }
    });
  });

  it("retryRun sends run.retry shape", () => {
    retryRun("run-3");

    expect(posted[0]).toMatchObject({
      version: 1,
      type: "run.retry",
      payload: { runId: "run-3" }
    });
  });

  it("openPlan sends plan.open shape", () => {
    openPlan("plan-99");

    expect(posted[0]).toMatchObject({
      version: 1,
      type: "plan.open",
      payload: { planId: "plan-99" }
    });
    expect((posted[0] as { requestId: unknown }).requestId).toEqual(
      expect.any(String)
    );
  });

  it("openRun sends run.open shape", () => {
    openRun("run-42");

    expect(posted[0]).toMatchObject({
      version: 1,
      type: "run.open",
      payload: { runId: "run-42" }
    });
    expect((posted[0] as { requestId: unknown }).requestId).toEqual(
      expect.any(String)
    );
  });
});
