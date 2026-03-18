import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

import type { RepositoryRecord } from "@attractor/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FileRepositoryRegistry } from "../../../src/infrastructure/registry";

const makeRepo = (id: string): RepositoryRecord => ({
  version: 1,
  id,
  name: `Repo ${id}`,
  rootUri: `/home/user/repos/${id}`,
  defaultBranch: "main",
  labels: []
});

describe("FileRepositoryRegistry", () => {
  let tmpDir: string;
  let registry: FileRepositoryRegistry;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "attractor-registry-"));
    registry = new FileRepositoryRegistry(tmpDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("adds and finds a repository", async () => {
    const repo = makeRepo("repo-001");
    await registry.add(repo);
    const found = await registry.find("repo-001");
    expect(found).toEqual(repo);
  });

  it("returns undefined for unknown repo id", async () => {
    const found = await registry.find("does-not-exist");
    expect(found).toBeUndefined();
  });

  it("upserts an existing repository on add", async () => {
    const repo = makeRepo("repo-002");
    await registry.add(repo);
    const updated: RepositoryRecord = { ...repo, name: "Updated Name" };
    await registry.add(updated);
    const found = await registry.find("repo-002");
    expect(found?.name).toBe("Updated Name");
  });

  it("removes a repository", async () => {
    await registry.add(makeRepo("repo-003"));
    await registry.remove("repo-003");
    const found = await registry.find("repo-003");
    expect(found).toBeUndefined();
  });

  it("removing non-existent repo is a no-op", async () => {
    await registry.add(makeRepo("repo-004"));
    await registry.remove("no-such-repo");
    const repos = await registry.list();
    expect(repos).toHaveLength(1);
  });

  it("lists all repositories", async () => {
    await registry.add(makeRepo("repo-a"));
    await registry.add(makeRepo("repo-b"));
    await registry.add(makeRepo("repo-c"));
    const repos = await registry.list();
    expect(repos).toHaveLength(3);
  });

  it("returns empty list initially", async () => {
    const repos = await registry.list();
    expect(repos).toEqual([]);
  });

  it("persists to .attractor/registry.json", async () => {
    await registry.add(makeRepo("repo-005"));
    const filePath = path.join(tmpDir, ".attractor", "registry.json");
    const raw = await fs.readFile(filePath, "utf8");
    const parsed: unknown = JSON.parse(raw);
    expect(parsed).toMatchObject({
      version: 1,
      repositories: [{ id: "repo-005" }]
    });
  });

  it("supports remoteUrl as optional field", async () => {
    const repo: RepositoryRecord = {
      ...makeRepo("repo-remote"),
      remoteUrl: "https://github.com/org/repo"
    };
    await registry.add(repo);
    const found = await registry.find("repo-remote");
    expect(found?.remoteUrl).toBe("https://github.com/org/repo");
  });
});
