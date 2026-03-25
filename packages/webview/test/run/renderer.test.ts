import { describe, it, expect } from "vitest";
import {
  renderRun,
  renderOrchestrationPhaseBar,
  renderRepoBadgeRow
} from "../../src/run/renderer";
import type { OrchestrationState, RunState } from "../../src/run/model";

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
    expect(html).toContain('data-action="run.resume"');
    expect(html).toContain('data-action="run.cancel"');
  });

  it("should render retry control for completed run", () => {
    const state: RunState = {
      ...baseState,
      run: { ...baseRun, status: "completed" }
    };
    const html = renderRun(state);
    expect(html).toContain('data-action="run.retry"');
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

  it("should render OrchestrationPhaseBar when orchestration state provided", () => {
    const orchestration: OrchestrationState = {
      runId: "run_001",
      milestoneIndex: 2,
      milestoneCount: 5,
      milestoneName: "Generate changelog",
      phases: [
        { role: "orchestrator", status: "done" },
        { role: "planner", status: "done" },
        {
          role: "implementer",
          status: "running",
          taskSummary: "Generating CHANGELOG.md"
        },
        { role: "reviewer", status: "waiting" }
      ]
    };
    const html = renderRun({ ...baseState, orchestration });
    expect(html).toContain("orchestration-phase-bar");
    expect(html).toContain("Milestone 2/5");
    expect(html).toContain("Generate changelog");
    expect(html).toContain("Orchestrator");
    expect(html).toContain("Implementer");
    expect(html).toContain("Generating CHANGELOG.md");
  });

  it("should not render OrchestrationPhaseBar when orchestration is absent", () => {
    const html = renderRun(baseState);
    expect(html).not.toContain("orchestration-phase-bar");
  });

  it("should render RetryFromRoleActions when a role has failed", () => {
    const orchestration: OrchestrationState = {
      runId: "run_001",
      milestoneIndex: 1,
      milestoneCount: 3,
      milestoneName: "Setup",
      phases: [
        { role: "orchestrator", status: "done" },
        { role: "planner", status: "done" },
        {
          role: "implementer",
          status: "failed",
          errorLabel: "git log command failed"
        },
        { role: "reviewer", status: "skipped" }
      ]
    };
    const html = renderRun({ ...baseState, orchestration });
    expect(html).toContain("retry-role-actions");
    expect(html).toContain("run.retry.implementer");
    expect(html).toContain("run.retry.from-planner");
    expect(html).toContain("git log command failed");
  });

  it("should render RepoBadgeRow when repositories are provided", () => {
    const state: RunState = {
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
    const html = renderRun(state);
    expect(html).toContain("repo-badge-row");
    expect(html).toContain("WRITABLE");
    expect(html).toContain("repo-beta");
  });
});

describe("renderOrchestrationPhaseBar", () => {
  const baseOrchestration: OrchestrationState = {
    runId: "run_001",
    milestoneIndex: 1,
    milestoneCount: 3,
    milestoneName: "Setup",
    phases: [
      { role: "orchestrator", status: "done" },
      { role: "planner", status: "done" },
      { role: "implementer", status: "running", taskSummary: "Running tests" },
      { role: "reviewer", status: "waiting" }
    ]
  };

  it("should render milestone progress header", () => {
    const html = renderOrchestrationPhaseBar(baseOrchestration, "run_001");
    expect(html).toContain("Milestone 1/3");
    expect(html).toContain("Setup");
  });

  it("should render all four role boxes", () => {
    const html = renderOrchestrationPhaseBar(baseOrchestration, "run_001");
    expect(html).toContain("Orchestrator");
    expect(html).toContain("Planner");
    expect(html).toContain("Implementer");
    expect(html).toContain("Reviewer");
  });

  it("should render active task summary for running role", () => {
    const html = renderOrchestrationPhaseBar(baseOrchestration, "run_001");
    expect(html).toContain("Running tests");
    expect(html).toContain("orchestration-active-task");
  });

  it("should use status CSS classes", () => {
    const html = renderOrchestrationPhaseBar(baseOrchestration, "run_001");
    expect(html).toContain("agent-role-status--done");
    expect(html).toContain("agent-role-status--running");
    expect(html).toContain("agent-role-status--waiting");
  });
});

describe("renderRepoBadgeRow", () => {
  const repos = [
    {
      version: 1 as const,
      id: "repo_alpha",
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

  it("should render writable badge for read_write repo", () => {
    const planRepos = [{ repositoryId: "repo_alpha", access: "read_write" }];
    const html = renderRepoBadgeRow(repos, planRepos);
    expect(html).toContain("[WRITABLE]");
    expect(html).toContain("repo-badge--writable");
    expect(html).toContain("repo-beta");
    expect(html).toContain("main");
  });

  it("should render read-only badge for read_only repo", () => {
    const planRepos = [{ repositoryId: "repo_docs", access: "read_only" }];
    const html = renderRepoBadgeRow(repos, planRepos);
    expect(html).toContain("[READ-ONLY]");
    expect(html).toContain("repo-badge--readonly");
    expect(html).toContain("repo-docs");
    expect(html).toContain("docs/v2");
  });

  it("should render multiple badges", () => {
    const planRepos = [
      { repositoryId: "repo_alpha", access: "read_write" },
      { repositoryId: "repo_docs", access: "read_only" }
    ];
    const html = renderRepoBadgeRow(repos, planRepos);
    expect(html).toContain("[WRITABLE]");
    expect(html).toContain("[READ-ONLY]");
  });

  it("should return empty string when repositories array is empty", () => {
    const html = renderRepoBadgeRow(
      [],
      [{ repositoryId: "repo_alpha", access: "read_write" }]
    );
    expect(html).toBe("");
  });
});
