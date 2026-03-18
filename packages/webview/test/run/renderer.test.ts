import { describe, it, expect } from "vitest";
import { renderRun } from "../../src/run/renderer";
import type { RunState } from "../../src/run/model";

const basePlan = {
  version: 1 as const,
  id: "plan_001",
  title: "Implement Feature X",
  goal: "Goal",
  status: "running" as const,
  repositories: [
    {
      repositoryId: "repo_alpha",
      role: "executable" as const,
      access: "read_write" as const,
      mountAlias: "src"
    }
  ],
  primaryExecutableRepositoryId: "repo_alpha",
  graphSource: "digraph G {}",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

const baseRun = {
  version: 1 as const,
  id: "run_001",
  planId: "plan_001",
  graphId: "graph_001",
  worktreeId: "wt_001",
  status: "running" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

const baseState: RunState = {
  run: baseRun,
  plan: basePlan,
  currentStep: null,
  logTail: []
};

describe("renderRun", () => {
  it("should render Run Inspector heading", () => {
    const html = renderRun(baseState);
    expect(html).toContain("<h1>Run Inspector</h1>");
    expect(html).toContain("run-container");
  });

  it("should render run ID and plan title", () => {
    const html = renderRun(baseState);
    expect(html).toContain("run_001");
    expect(html).toContain("Implement Feature X");
  });

  it("should render run status with CSS class", () => {
    const html = renderRun(baseState);
    expect(html).toContain("run-status--running");
    expect(html).toContain("running");
  });

  it("should render current step when present", () => {
    const state: RunState = { ...baseState, currentStep: "step-A" };
    const html = renderRun(state);
    expect(html).toContain("current-step");
    expect(html).toContain("step-A");
  });

  it("should not render current step section when null", () => {
    const html = renderRun(baseState);
    expect(html).not.toContain("current-step-id");
  });

  it("should render log lines", () => {
    const state: RunState = {
      ...baseState,
      logTail: ["[INFO] Step started", "[INFO] Processing..."]
    };
    const html = renderRun(state);
    expect(html).toContain("[INFO] Step started");
    expect(html).toContain("[INFO] Processing...");
  });

  it("should render no log message when logTail is empty", () => {
    const html = renderRun(baseState);
    expect(html).toContain("No log output");
  });

  it("should render resume and cancel controls for running run", () => {
    const html = renderRun(baseState);
    expect(html).toContain("data-action=\"run.resume\"");
    expect(html).toContain("data-action=\"run.cancel\"");
  });

  it("should render retry control for completed run", () => {
    const state: RunState = {
      ...baseState,
      run: { ...baseRun, status: "completed" }
    };
    const html = renderRun(state);
    expect(html).toContain("data-action=\"run.retry\"");
  });

  it("should render completed timestamps when present", () => {
    const state: RunState = {
      ...baseState,
      run: {
        ...baseRun,
        startedAt: "2026-01-01T00:00:30.000Z",
        completedAt: "2026-01-01T00:05:00.000Z",
        status: "completed"
      }
    };
    const html = renderRun(state);
    expect(html).toContain("2026-01-01T00:00:30.000Z");
    expect(html).toContain("2026-01-01T00:05:00.000Z");
  });

  it("should escape HTML in log lines", () => {
    const state: RunState = {
      ...baseState,
      logTail: ["<script>alert('xss')</script>"]
    };
    const html = renderRun(state);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
