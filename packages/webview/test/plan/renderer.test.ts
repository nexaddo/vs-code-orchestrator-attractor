import { describe, it, expect } from "vitest";
import {
  renderPlan,
  renderPlanRepositoryPicker
} from "../../src/plan/renderer";
import type {
  PlanRepositoryPickerState,
  PlanState
} from "../../src/plan/model";

const basePlan = {
  version: 1 as const,
  id: "plan_001",
  title: "Implement Feature X",
  goal: "Add feature X to the codebase",
  status: "draft" as const,
  repositories: [
    {
      repositoryId: "repo_alpha",
      role: "executable" as const,
      access: "read_write" as const,
      mountAlias: "src"
    }
  ],
  primaryExecutableRepositoryId: "repo_alpha",
  graphSource: "digraph G { A -> B }",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

const baseState: PlanState = {
  plan: basePlan,
  graph: null,
  runs: [],
  activeRun: null
};

describe("renderPlan", () => {
  it("should render Plan Inspector heading", () => {
    const html = renderPlan(baseState);
    expect(html).toContain("<h1>Plan Inspector</h1>");
    expect(html).toContain("plan-container");
  });

  it("should render plan title and goal", () => {
    const html = renderPlan(baseState);
    expect(html).toContain("Implement Feature X");
    expect(html).toContain("Add feature X to the codebase");
  });

  it("should render plan status", () => {
    const html = renderPlan(baseState);
    expect(html).toContain("plan-status--draft");
    expect(html).toContain("draft");
  });

  it("should render Repositories section", () => {
    const html = renderPlan(baseState);
    expect(html).toContain("<h2>Repositories</h2>");
    expect(html).toContain("repo_alpha");
    expect(html).toContain("executable");
    expect(html).toContain("read_write");
  });

  it("should render no graph message when graph is null", () => {
    const html = renderPlan(baseState);
    expect(html).toContain("No graph compiled yet");
  });

  it("should render graph when present", () => {
    const state: PlanState = {
      ...baseState,
      graph: {
        version: 1,
        id: "graph_001",
        planId: "plan_001",
        source: "digraph G { A -> B }",
        nodes: [
          { id: "A", label: "Step A", dependsOn: [] },
          { id: "B", label: "Step B", dependsOn: ["A"] }
        ],
        createdAt: "2026-01-01T00:00:00.000Z"
      }
    };
    const html = renderPlan(state);
    expect(html).toContain("2 nodes");
    expect(html).toContain("digraph G");
  });

  it("should render no runs message when runs is empty", () => {
    const html = renderPlan(baseState);
    expect(html).toContain("No runs yet");
  });

  it("should render active run banner when activeRun is set", () => {
    const run = {
      version: 1 as const,
      id: "run_001",
      planId: "plan_001",
      graphId: "graph_001",
      worktreeId: "wt_001",
      status: "running" as const,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z"
    };
    const state: PlanState = { ...baseState, runs: [run], activeRun: run };
    const html = renderPlan(state);
    expect(html).toContain("active-run-banner");
    expect(html).toContain("run_001");
  });

  it("should render Start New Run button", () => {
    const html = renderPlan(baseState);
    expect(html).toContain('data-action="plan.run"');
    expect(html).toContain("Start New Run");
  });

  it("should escape HTML in plan title", () => {
    const state: PlanState = {
      ...baseState,
      plan: { ...basePlan, title: "<script>alert('xss')</script>" }
    };
    const html = renderPlan(state);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("should render RepoBadgeRow when repositories are provided", () => {
    const state: PlanState = {
      ...baseState,
      repositories: [
        {
          version: 1,
          id: "repo_alpha",
          name: "repo-beta",
          rootUri: "/repos/repo-beta",
          defaultBranch: "main",
          labels: []
        }
      ]
    };
    const html = renderPlan(state);
    expect(html).toContain("repo-badge-row");
    expect(html).toContain("[WRITABLE]");
    expect(html).toContain("repo-beta");
    expect(html).toContain("main");
  });

  it("should not render RepoBadgeRow when repositories are absent", () => {
    const html = renderPlan(baseState);
    expect(html).not.toContain("repo-badge-row");
  });
});

describe("renderPlanRepositoryPicker", () => {
  const baseRepos = [
    {
      version: 1 as const,
      id: "repo_beta",
      name: "repo-beta",
      rootUri: "/repos/repo-beta",
      defaultBranch: "main",
      labels: []
    },
    {
      version: 1 as const,
      id: "repo_docs",
      name: "repo-docs",
      rootUri: "/repos/repo-docs",
      defaultBranch: "docs/v2",
      labels: []
    }
  ];

  const basePickerState: PlanRepositoryPickerState = {
    availableRepositories: baseRepos,
    selectedExecutableId: "repo_beta",
    selectedContextIds: [],
    contextAliases: {}
  };

  it("should render executable and context sections", () => {
    const html = renderPlanRepositoryPicker(basePickerState);
    expect(html).toContain("plan-repository-picker");
    expect(html).toContain("Executable Repository");
    expect(html).toContain("Context Repositories");
  });

  it("should render radio inputs for executable repos", () => {
    const html = renderPlanRepositoryPicker(basePickerState);
    expect(html).toContain('type="radio"');
    expect(html).toContain('data-action="plan.picker.executable"');
  });

  it("should mark selected executable repo as checked", () => {
    const html = renderPlanRepositoryPicker(basePickerState);
    expect(html).toContain('value="repo_beta" checked');
  });

  it("should exclude executable repo from context section", () => {
    const html = renderPlanRepositoryPicker(basePickerState);
    const contextSection = html.split("Context Repositories")[1] ?? "";
    expect(contextSection).not.toContain("repo_beta");
    expect(contextSection).toContain("repo_docs");
  });

  it("should render checkbox inputs for context repos", () => {
    const html = renderPlanRepositoryPicker(basePickerState);
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('data-action="plan.picker.context"');
  });

  it("should mark checked context repos", () => {
    const state: PlanRepositoryPickerState = {
      ...basePickerState,
      selectedContextIds: ["repo_docs"]
    };
    const html = renderPlanRepositoryPicker(state);
    expect(html).toContain('value="repo_docs" checked');
  });

  it("should render v1 one-writable-repo note", () => {
    const html = renderPlanRepositoryPicker(basePickerState);
    expect(html).toContain("v1 allows exactly one writable repository");
  });

  it("should render register repository button", () => {
    const html = renderPlanRepositoryPicker(basePickerState);
    expect(html).toContain('data-action="repository.add"');
    expect(html).toContain("Register Another Repository");
  });

  it("should render empty state when no repositories available", () => {
    const state: PlanRepositoryPickerState = {
      ...basePickerState,
      availableRepositories: [],
      selectedExecutableId: null
    };
    const html = renderPlanRepositoryPicker(state);
    expect(html).toContain("No repositories registered");
  });
});
