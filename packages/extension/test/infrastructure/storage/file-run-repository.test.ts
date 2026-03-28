import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

import type { RunRecord } from "@attractor/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FileRunRepository } from "../../../src/infrastructure/storage";

const makeRun = (id: string): RunRecord => ({
  version: 1,
  id,
  planId: "plan-1",
  attempt: 1,
  status: "queued",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
});

describe("FileRunRepository", () => {
  let tmpDir: string;
  let repo: FileRunRepository;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "attractor-run-repo-"));
    repo = new FileRunRepository(tmpDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("saves and retrieves a run by id", async () => {
    const run = makeRun("run-001");
    await repo.save(run);
    const found = await repo.find("run-001");
    expect(found).toEqual(run);
  });

  it("returns undefined for unknown run id", async () => {
    const found = await repo.find("does-not-exist");
    expect(found).toBeUndefined();
  });

  it("overwrites an existing run on save", async () => {
    const run = makeRun("run-002");
    await repo.save(run);
    const updated: RunRecord = { ...run, status: "running" };
    await repo.save(updated);
    const found = await repo.find("run-002");
    expect(found?.status).toBe("running");
  });

  it("lists all saved runs", async () => {
    await repo.save(makeRun("run-a"));
    await repo.save(makeRun("run-b"));
    const runs = await repo.list();
    expect(runs).toHaveLength(2);
    const ids = runs.map((r) => r.id).sort();
    expect(ids).toEqual(["run-a", "run-b"]);
  });

  it("returns empty list when no runs exist", async () => {
    const runs = await repo.list();
    expect(runs).toEqual([]);
  });

  it("persists run.json inside .attractor/runs/<runId>/", async () => {
    const run = makeRun("run-003");
    await repo.save(run);
    const filePath = path.join(
      tmpDir,
      ".attractor",
      "runs",
      "run-003",
      "run.json"
    );
    const raw = await fs.readFile(filePath, "utf8");
    const parsed: unknown = JSON.parse(raw);
    expect(parsed).toMatchObject({ id: "run-003", status: "queued" });
  });
});
