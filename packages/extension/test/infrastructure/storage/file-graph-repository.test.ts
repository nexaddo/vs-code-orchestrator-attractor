import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

import type { GraphRecord } from "@attractor/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FileGraphRepository } from "../../../src/infrastructure/storage";

const makeGraph = (id: string): GraphRecord => ({
  version: 1,
  id,
  planId: "plan-1",
  source: "digraph G { A -> B }",
  nodes: [
    { id: "A", label: "Step A", dependsOn: [] },
    { id: "B", label: "Step B", dependsOn: ["A"] }
  ],
  createdAt: "2026-01-01T00:00:00.000Z"
});

describe("FileGraphRepository", () => {
  let tmpDir: string;
  let repo: FileGraphRepository;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "attractor-graph-repo-"));
    repo = new FileGraphRepository(tmpDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("saves and retrieves a graph by id", async () => {
    const graph = makeGraph("graph-001");
    await repo.save(graph);
    const found = await repo.find("graph-001");
    expect(found).toEqual(graph);
  });

  it("returns undefined for unknown graph id", async () => {
    const found = await repo.find("does-not-exist");
    expect(found).toBeUndefined();
  });

  it("overwrites an existing graph on save", async () => {
    const graph = makeGraph("graph-002");
    await repo.save(graph);
    const updated: GraphRecord = {
      ...graph,
      nodes: [{ id: "X", label: "New Step", dependsOn: [] }]
    };
    await repo.save(updated);
    const found = await repo.find("graph-002");
    expect(found?.nodes).toHaveLength(1);
    expect(found?.nodes[0]?.id).toBe("X");
  });

  it("persists to .attractor/graphs/<graphId>.json", async () => {
    const graph = makeGraph("graph-003");
    await repo.save(graph);
    const filePath = path.join(
      tmpDir,
      ".attractor",
      "graphs",
      "graph-003.json"
    );
    const raw = await fs.readFile(filePath, "utf8");
    const parsed: unknown = JSON.parse(raw);
    expect(parsed).toMatchObject({ id: "graph-003" });
  });
});
