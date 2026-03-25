/**
 * Acceptance tests for Run Inspector UAC scenarios.
 *
 * UAC source: docs/ui-design.md (Run Inspector, Orchestration Workflow UI)
 *
 * Coverage areas:
 * - UAC-RUN-1: Run control buttons per status
 * - UAC-RUN-2: Orchestration recovery actions by role
 * - UAC-RUN-3: XSS escaping in repo badge row
 */
import { describe, it, expect } from "vitest";
import {
  renderRun,
  renderOrchestrationPhaseBar,
  renderRepoBadgeRow
} from "../../src/run/renderer";
import type { OrchestrationState, RunState } from "../../src/run/model";

// ── Shared fixtures ──────────────────────────────────────────────────────────

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
  id: "run_abc",
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

// ── UAC-RUN-1: Run control buttons per status ────────────────────────────────

describe("UAC-RUN-1: Run control buttons per run status", () => {
  /**
   * Given: run status = paused
   * When: Run Inspector is rendered
   * Then: Resume button is enabled (no disabled attr), Cancel button is enabled
   */
  it("paused run — Resume button is enabled and Cancel button is enabled", () => {
    const state: RunState = {
      ...baseState,
      run: { ...baseRun, status: "paused" }
    };
    const html = renderRun(state);
    // Resume must not have disabled attribute
    const resumeMatch = html.match(/data-action="run\.resume"([^>]*)/);
    expect(resumeMatch).not.toBeNull();
    expect(resumeMatch![0]).not.toContain("disabled");
    // Cancel must not have disabled attribute
    const cancelMatch = html.match(/data-action="run\.cancel"([^>]*)/);
    expect(cancelMatch).not.toBeNull();
    expect(cancelMatch![0]).not.toContain("disabled");
  });

  /**
   * Given: run status = running
   * When: Run Inspector is rendered
   * Then: Resume button is disabled (not paused), Cancel button is enabled
   */
  it("running run — Resume button is disabled, Cancel is enabled", () => {
    const html = renderRun(baseState); // status = running
    const resumeMatch = html.match(/data-action="run\.resume"([^>]*)/);
    expect(resumeMatch).not.toBeNull();
    expect(resumeMatch![0]).toContain("disabled");
    const cancelMatch = html.match(/data-action="run\.cancel"([^>]*)/);
    expect(cancelMatch).not.toBeNull();
    expect(cancelMatch![0]).not.toContain("disabled");
  });

  /**
   * Given: run status = failed
   * When: Run Inspector is rendered
   * Then: Retry button appears (terminal state), Resume/Cancel not shown
   */
  it("failed run — shows Retry button only (terminal state)", () => {
    const state: RunState = {
      ...baseState,
      run: { ...baseRun, status: "failed" }
    };
    const html = renderRun(state);
    expect(html).toContain('data-action="run.retry"');
    expect(html).not.toContain('data-action="run.resume"');
    expect(html).not.toContain('data-action="run.cancel"');
  });

  /**
   * Given: run status = canceled
   * When: Run Inspector is rendered
   * Then: Retry button appears (terminal state)
   */
  it("canceled run — shows Retry button only (terminal state)", () => {
    const state: RunState = {
      ...baseState,
      run: { ...baseRun, status: "canceled" }
    };
    const html = renderRun(state);
    expect(html).toContain('data-action="run.retry"');
    expect(html).not.toContain('data-action="run.resume"');
    expect(html).not.toContain('data-action="run.cancel"');
  });

  /**
   * Given: run status = queued (not paused, not terminal)
   * When: Run Inspector is rendered
   * Then: Resume button is disabled (not yet started), Cancel is enabled
   */
  it("queued run — Resume is disabled, Cancel is enabled", () => {
    const state: RunState = {
      ...baseState,
      run: { ...baseRun, status: "queued" }
    };
    const html = renderRun(state);
    const resumeMatch = html.match(/data-action="run\.resume"([^>]*)/);
    expect(resumeMatch).not.toBeNull();
    expect(resumeMatch![0]).toContain("disabled");
    const cancelMatch = html.match(/data-action="run\.cancel"([^>]*)/);
    expect(cancelMatch).not.toBeNull();
    expect(cancelMatch![0]).not.toContain("disabled");
  });
});

// ── UAC-RUN-2: Orchestration recovery actions by role ────────────────────────

describe("UAC-RUN-2: Orchestration recovery actions are role-specific", () => {
  /**
   * Given: implementer role has failed
   * When: OrchestrationPhaseBar is rendered
   * Then: "Retry Implementer" and "Retry From Planner" shown; "View Artifacts" shown
   */
  it("implementer failed — shows Retry Implementer + Retry From Planner + View Artifacts", () => {
    const orchestration: OrchestrationState = {
      runId: "run_abc",
      milestoneIndex: 1,
      milestoneCount: 3,
      milestoneName: "Setup",
      phases: [
        { role: "orchestrator", status: "done" },
        { role: "planner", status: "done" },
        {
          role: "implementer",
          status: "failed",
          errorLabel: "Compilation error"
        },
        { role: "reviewer", status: "skipped" }
      ]
    };
    const html = renderOrchestrationPhaseBar(orchestration, "run_abc");
    expect(html).toContain('data-action="run.retry.implementer"');
    expect(html).toContain('data-action="run.retry.from-planner"');
    expect(html).toContain('data-action="run.artifacts.view"');
    // Must NOT show milestone retry (that's for orchestrator/planner failure)
    expect(html).not.toContain('data-action="run.retry.milestone"');
  });

  /**
   * Given: reviewer role has failed
   * When: OrchestrationPhaseBar is rendered
   * Then: Only "Retry From Planner" shown (no "Retry Implementer"); "View Artifacts" shown
   */
  it("reviewer failed — shows Retry From Planner + View Artifacts only (no Retry Implementer)", () => {
    const orchestration: OrchestrationState = {
      runId: "run_abc",
      milestoneIndex: 2,
      milestoneCount: 4,
      milestoneName: "Code Review",
      phases: [
        { role: "orchestrator", status: "done" },
        { role: "planner", status: "done" },
        { role: "implementer", status: "done" },
        {
          role: "reviewer",
          status: "failed",
          errorLabel: "Review blocked: missing test coverage"
        }
      ]
    };
    const html = renderOrchestrationPhaseBar(orchestration, "run_abc");
    expect(html).toContain('data-action="run.retry.from-planner"');
    expect(html).toContain('data-action="run.artifacts.view"');
    expect(html).not.toContain('data-action="run.retry.implementer"');
    expect(html).not.toContain('data-action="run.retry.milestone"');
  });

  /**
   * Given: orchestrator role has failed
   * When: OrchestrationPhaseBar is rendered
   * Then: "Retry Milestone" shown; "View Artifacts" shown; no role-specific retry
   */
  it("orchestrator failed — shows Retry Milestone + View Artifacts", () => {
    const orchestration: OrchestrationState = {
      runId: "run_abc",
      milestoneIndex: 1,
      milestoneCount: 3,
      milestoneName: "Init",
      phases: [
        {
          role: "orchestrator",
          status: "failed",
          errorLabel: "Could not parse milestone"
        },
        { role: "planner", status: "skipped" },
        { role: "implementer", status: "skipped" },
        { role: "reviewer", status: "skipped" }
      ]
    };
    const html = renderOrchestrationPhaseBar(orchestration, "run_abc");
    expect(html).toContain('data-action="run.retry.milestone"');
    expect(html).toContain('data-action="run.artifacts.view"');
    expect(html).not.toContain('data-action="run.retry.implementer"');
    expect(html).not.toContain('data-action="run.retry.from-planner"');
  });

  /**
   * Given: planner role has failed
   * When: OrchestrationPhaseBar is rendered
   * Then: "Retry Milestone" shown; "View Artifacts" shown; no implementer retry
   */
  it("planner failed — shows Retry Milestone + View Artifacts", () => {
    const orchestration: OrchestrationState = {
      runId: "run_abc",
      milestoneIndex: 3,
      milestoneCount: 5,
      milestoneName: "Plan Tasks",
      phases: [
        { role: "orchestrator", status: "done" },
        {
          role: "planner",
          status: "failed",
          errorLabel: "Produced empty task pack"
        },
        { role: "implementer", status: "skipped" },
        { role: "reviewer", status: "skipped" }
      ]
    };
    const html = renderOrchestrationPhaseBar(orchestration, "run_abc");
    expect(html).toContain('data-action="run.retry.milestone"');
    expect(html).toContain('data-action="run.artifacts.view"');
    expect(html).not.toContain('data-action="run.retry.implementer"');
    expect(html).not.toContain('data-action="run.retry.from-planner"');
  });

  /**
   * Given: a recovery action button is rendered for any failed role
   * When: OrchestrationPhaseBar is rendered with a specific runId
   * Then: all retry buttons carry the correct data-run-id
   */
  it("recovery action buttons carry the correct data-run-id", () => {
    const orchestration: OrchestrationState = {
      runId: "run_target_123",
      milestoneIndex: 1,
      milestoneCount: 2,
      milestoneName: "Deploy",
      phases: [
        { role: "orchestrator", status: "done" },
        { role: "planner", status: "done" },
        {
          role: "implementer",
          status: "failed",
          errorLabel: "Deploy failed"
        },
        { role: "reviewer", status: "skipped" }
      ]
    };
    const html = renderOrchestrationPhaseBar(orchestration, "run_target_123");
    // Every retry/artifact button should reference run_target_123
    const retryButtons = html.match(/data-action="run\.retry\.[^"]*"/g) ?? [];
    const artifactButtons =
      html.match(/data-action="run\.artifacts\.[^"]*"/g) ?? [];
    const allActionButtons = [...retryButtons, ...artifactButtons];
    expect(allActionButtons.length).toBeGreaterThan(0);
    const runIdMatches = html.match(/data-run-id="run_target_123"/g) ?? [];
    // There should be exactly one data-run-id="run_target_123" per action button
    expect(runIdMatches.length).toBeGreaterThanOrEqual(allActionButtons.length);
  });
});

// ── UAC-RUN-3: XSS escaping in repo badge row ────────────────────────────────

describe("UAC-RUN-3: Repo badge row escapes HTML in repo name and branch", () => {
  /**
   * Given: repo name contains HTML injection
   * When: renderRepoBadgeRow is called
   * Then: name is HTML-escaped, no raw script tags in output
   */
  it("escapes HTML in repo name in badge row", () => {
    const repos = [
      {
        version: 1 as const,
        id: "repo_xss",
        name: "<script>alert('xss')</script>",
        rootUri: "/repos/evil",
        defaultBranch: "main",
        labels: []
      }
    ];
    const html = renderRepoBadgeRow(repos, [
      { repositoryId: "repo_xss", access: "read_write" }
    ]);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  /**
   * Given: repo defaultBranch contains HTML injection
   * When: renderRepoBadgeRow is called
   * Then: branch is HTML-escaped
   */
  it("escapes HTML in repo branch in badge row", () => {
    const repos = [
      {
        version: 1 as const,
        id: "repo_branch_xss",
        name: "safe-repo",
        rootUri: "/repos/safe",
        defaultBranch: "<img src=x onerror=alert(1)>",
        labels: []
      }
    ];
    const html = renderRepoBadgeRow(repos, [
      { repositoryId: "repo_branch_xss", access: "read_only" }
    ]);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  /**
   * Given: plan with a writable repo containing XSS in name
   * When: renderRun renders the run with repositories
   * Then: the run output does not contain raw script tags
   */
  it("escapes HTML in repo name when rendering full Run Inspector with badge row", () => {
    const state: RunState = {
      ...baseState,
      repositories: [
        {
          version: 1 as const,
          id: "repo_alpha",
          name: "<b>evil</b>",
          rootUri: "/repos/evil",
          defaultBranch: "main",
          labels: []
        }
      ]
    };
    const html = renderRun(state);
    expect(html).not.toContain("<b>evil</b>");
    expect(html).toContain("&lt;b&gt;evil&lt;/b&gt;");
  });
});
