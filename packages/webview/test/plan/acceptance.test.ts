/**
 * Acceptance tests for Plan Inspector UAC scenarios.
 *
 * UAC source: docs/ui-design.md (Multi-Repo Workspace UI)
 *
 * Coverage areas:
 * - UAC-PLAN-1: PlanRepositoryPicker mount alias defaults to repo name
 * - UAC-PLAN-2: PlanRepositoryPicker custom mount alias shown when provided
 * - UAC-PLAN-3: Plan Inspector RepoBadgeRow XSS escaping
 */
import { describe, it, expect } from "vitest";
import {
  renderPlan,
  renderPlanRepositoryPicker
} from "../../src/plan/renderer";
import type {
  PlanRepositoryPickerState,
  PlanState
} from "../../src/plan/model";

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

const basePlan = {
  version: 1 as const,
  id: "plan_001",
  title: "Implement Feature X",
  goal: "Add feature X to the codebase",
  status: "draft" as const,
  repositories: [
    {
      repositoryId: "repo_beta",
      role: "executable" as const,
      access: "read_write" as const,
      mountAlias: "src"
    }
  ],
  primaryExecutableRepositoryId: "repo_beta",
  graphSource: "digraph G { A -> B }",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

// ── UAC-PLAN-1: PlanRepositoryPicker mount alias defaults to repo name ────────

describe("UAC-PLAN-1: PlanRepositoryPicker mount alias defaults to repo name", () => {
  /**
   * Given: a context repo with no entry in contextAliases
   * When: renderPlanRepositoryPicker is called
   * Then: the context repo row shows "mount as: <repo-name>"
   */
  it("context repo with no alias — displays repo name as default alias", () => {
    const state: PlanRepositoryPickerState = {
      availableRepositories: baseRepos,
      selectedExecutableId: "repo_beta",
      selectedContextIds: ["repo_docs"],
      contextAliases: {}
    };
    const html = renderPlanRepositoryPicker(state);
    expect(html).toContain("mount as: repo-docs");
  });
});

// ── UAC-PLAN-2: PlanRepositoryPicker custom mount alias shown ─────────────────

describe("UAC-PLAN-2: PlanRepositoryPicker custom mount alias shown when provided", () => {
  /**
   * Given: a context repo with a custom alias in contextAliases
   * When: renderPlanRepositoryPicker is called
   * Then: the context repo row shows "mount as: <custom-alias>"
   */
  it("context repo with custom alias — displays the custom alias", () => {
    const state: PlanRepositoryPickerState = {
      availableRepositories: baseRepos,
      selectedExecutableId: "repo_beta",
      selectedContextIds: ["repo_docs"],
      contextAliases: { repo_docs: "docs-context" }
    };
    const html = renderPlanRepositoryPicker(state);
    expect(html).toContain("mount as: docs-context");
    expect(html).not.toContain("mount as: repo-docs");
  });

  /**
   * Given: multiple context repos each with different aliases
   * When: renderPlanRepositoryPicker is called
   * Then: each repo shows its own mount alias
   */
  it("multiple context repos — each shows its own alias", () => {
    const threeRepos = [
      ...baseRepos,
      {
        version: 1 as const,
        id: "repo_extra",
        name: "repo-extra",
        rootUri: "/repos/repo-extra",
        defaultBranch: "main",
        labels: []
      }
    ];
    const state: PlanRepositoryPickerState = {
      availableRepositories: threeRepos,
      selectedExecutableId: "repo_beta",
      selectedContextIds: ["repo_docs", "repo_extra"],
      contextAliases: {
        repo_docs: "docs",
        repo_extra: "extra-src"
      }
    };
    const html = renderPlanRepositoryPicker(state);
    expect(html).toContain("mount as: docs");
    expect(html).toContain("mount as: extra-src");
  });
});

// ── UAC-PLAN-3: Plan Inspector RepoBadgeRow XSS escaping ─────────────────────

describe("UAC-PLAN-3: Plan Inspector RepoBadgeRow escapes HTML in repo name and branch", () => {
  /**
   * Given: a repo in the plan with XSS in its name
   * When: renderPlan is called with that repo in the repositories list
   * Then: the badge row does not contain raw HTML/script tags
   */
  it("escapes HTML in repo name displayed in Plan Inspector badge row", () => {
    const state: PlanState = {
      plan: basePlan,
      graph: null,
      runs: [],
      activeRun: null,
      repositories: [
        {
          version: 1 as const,
          id: "repo_beta",
          name: "<script>alert('xss')</script>",
          rootUri: "/repos/repo-beta",
          defaultBranch: "main",
          labels: []
        }
      ]
    };
    const html = renderPlan(state);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  /**
   * Given: a repo in the plan with XSS in its defaultBranch
   * When: renderPlan is called with that repo in the repositories list
   * Then: the badge row does not contain raw HTML/script in the branch field
   */
  it("escapes HTML in repo branch displayed in Plan Inspector badge row", () => {
    const state: PlanState = {
      plan: basePlan,
      graph: null,
      runs: [],
      activeRun: null,
      repositories: [
        {
          version: 1 as const,
          id: "repo_beta",
          name: "repo-beta",
          rootUri: "/repos/repo-beta",
          defaultBranch: "<img src=x onerror=alert(1)>",
          labels: []
        }
      ]
    };
    const html = renderPlan(state);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});
