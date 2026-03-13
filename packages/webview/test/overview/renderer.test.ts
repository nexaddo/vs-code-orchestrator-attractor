import { describe, it, expect } from "vitest";
import { renderOverview } from "../../src/overview/renderer";
import type { OverviewState } from "../../src/overview/model";

describe("renderOverview", () => {
  it("should render stable read-only markup with Overview heading", () => {
    const state: OverviewState = {
      summary: {
        totalRepositories: 2,
        totalPlans: 1,
        activeRuns: 0
      },
      repositories: [
        {
          version: 1,
          id: "repo_alpha",
          name: "repo-alpha",
          rootUri: "file:///workspace/repo-alpha",
          defaultBranch: "main",
          labels: ["workspace"]
        }
      ]
    };

    const html = renderOverview(state);

    expect(html).toContain("<h1>Overview</h1>");
    expect(html).toContain("overview-container");
  });

  it("should render Workspace Summary section", () => {
    const state: OverviewState = {
      summary: {
        totalRepositories: 2,
        totalPlans: 1,
        activeRuns: 0
      },
      repositories: []
    };

    const html = renderOverview(state);

    expect(html).toContain("<h2>Workspace Summary</h2>");
    expect(html).toContain("workspace-summary");
  });

  it("should render summary counts", () => {
    const state: OverviewState = {
      summary: {
        totalRepositories: 5,
        totalPlans: 3,
        activeRuns: 2
      },
      repositories: []
    };

    const html = renderOverview(state);

    expect(html).toContain("Repositories");
    expect(html).toContain("5");
    expect(html).toContain("Plans");
    expect(html).toContain("3");
    expect(html).toContain("Active Runs");
    expect(html).toContain("2");
  });

  it("should render Repositories section", () => {
    const state: OverviewState = {
      summary: {
        totalRepositories: 1,
        totalPlans: 0,
        activeRuns: 0
      },
      repositories: []
    };

    const html = renderOverview(state);

    expect(html).toContain("<h2>Repositories</h2>");
    expect(html).toContain("repositories");
  });

  it("should render repository names", () => {
    const state: OverviewState = {
      summary: {
        totalRepositories: 2,
        totalPlans: 0,
        activeRuns: 0
      },
      repositories: [
        {
          version: 1,
          id: "repo_alpha",
          name: "repo-alpha",
          rootUri: "file:///workspace/repo-alpha",
          defaultBranch: "main",
          labels: []
        },
        {
          version: 1,
          id: "repo_beta",
          name: "repo-beta",
          rootUri: "file:///workspace/repo-beta",
          defaultBranch: "main",
          labels: []
        }
      ]
    };

    const html = renderOverview(state);

    expect(html).toContain("repo-alpha");
    expect(html).toContain("repo-beta");
  });

  it("should escape HTML in repository names", () => {
    const state: OverviewState = {
      summary: {
        totalRepositories: 1,
        totalPlans: 0,
        activeRuns: 0
      },
      repositories: [
        {
          version: 1,
          id: "repo_xss",
          name: "<script>alert('xss')</script>",
          rootUri: "file:///workspace/repo",
          defaultBranch: "main",
          labels: []
        }
      ]
    };

    const html = renderOverview(state);

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
