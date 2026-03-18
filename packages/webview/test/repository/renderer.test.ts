import { describe, it, expect } from "vitest";
import { renderRepository } from "../../src/repository/renderer";
import type { RepositoryState } from "../../src/repository/model";

const baseRepo = {
  version: 1 as const,
  id: "repo_alpha",
  name: "repo-alpha",
  rootUri: "file:///workspace/repo-alpha",
  defaultBranch: "main",
  labels: []
};

describe("renderRepository", () => {
  it("should render Repository Inspector heading", () => {
    const state: RepositoryState = { repository: baseRepo, plans: [] };
    const html = renderRepository(state);
    expect(html).toContain("<h1>Repository Inspector</h1>");
    expect(html).toContain("repository-container");
  });

  it("should render repository name", () => {
    const state: RepositoryState = { repository: baseRepo, plans: [] };
    const html = renderRepository(state);
    expect(html).toContain("repo-alpha");
  });

  it("should render rootUri and defaultBranch", () => {
    const state: RepositoryState = { repository: baseRepo, plans: [] };
    const html = renderRepository(state);
    expect(html).toContain("file:///workspace/repo-alpha");
    expect(html).toContain("main");
  });

  it("should render remoteUrl when present", () => {
    const state: RepositoryState = {
      repository: { ...baseRepo, remoteUrl: "https://github.com/org/repo" },
      plans: []
    };
    const html = renderRepository(state);
    expect(html).toContain("https://github.com/org/repo");
  });

  it("should not render remoteUrl section when absent", () => {
    const state: RepositoryState = { repository: baseRepo, plans: [] };
    const html = renderRepository(state);
    expect(html).not.toContain("<dt>Remote</dt>");
  });

  it("should render labels", () => {
    const state: RepositoryState = {
      repository: { ...baseRepo, labels: ["workspace", "primary"] },
      plans: []
    };
    const html = renderRepository(state);
    expect(html).toContain("workspace");
    expect(html).toContain("primary");
  });

  it("should render empty label message when no labels", () => {
    const state: RepositoryState = { repository: baseRepo, plans: [] };
    const html = renderRepository(state);
    expect(html).toContain("No labels");
  });

  it("should render Plans section", () => {
    const state: RepositoryState = { repository: baseRepo, plans: [] };
    const html = renderRepository(state);
    expect(html).toContain("<h2>Plans</h2>");
    expect(html).toContain("No plans registered");
  });

  it("should render plan items", () => {
    const plan = {
      version: 1 as const,
      id: "plan_001",
      title: "My Plan",
      goal: "Goal",
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
      graphSource: "digraph G {}",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z"
    };
    const state: RepositoryState = { repository: baseRepo, plans: [plan] };
    const html = renderRepository(state);
    expect(html).toContain("My Plan");
    expect(html).toContain("draft");
  });

  it("should escape HTML in repository name", () => {
    const state: RepositoryState = {
      repository: { ...baseRepo, name: "<script>alert('xss')</script>" },
      plans: []
    };
    const html = renderRepository(state);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
