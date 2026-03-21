import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { describe, it, expect } from "vitest";

import { FileRepositoryRegistry } from "../../src/storage/repositories/file-repository-registry";
import { FilePlanRegistry } from "../../src/storage/plans/file-plan-registry";
import { FileRunRegistry } from "../../src/storage/runs/file-run-registry";
import type {
  RepositoryRecord,
  PlanRecord,
  RunRecord
} from "@attractor/shared";

const makeTempDir = async () => {
  const prefix = path.join(os.tmpdir(), "attractor-test-");
  return mkdtemp(prefix);
};

describe("storage read surface - File*Registry list APIs", () => {
  it("repositoryRegistry.list() returns empty array when no records exist", async () => {
    const tmp = await makeTempDir();
    try {
      const repo = new FileRepositoryRegistry(tmp);
      const list = await repo.list();
      expect(list).toEqual([]);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it("repositoryRegistry.list() returns saved records in id order", async () => {
    const tmp = await makeTempDir();
    try {
      const repo = new FileRepositoryRegistry(tmp);
      const r2: RepositoryRecord = {
        version: 1 as const,
        id: "repo-002",
        name: "repo 2",
        rootUri: "file:///workspace/repo2",
        defaultBranch: "main",
        labels: []
      };
      const r1: RepositoryRecord = {
        version: 1 as const,
        id: "repo-001",
        name: "repo 1",
        rootUri: "file:///workspace/repo1",
        defaultBranch: "main",
        labels: []
      };

      await repo.save(r2);
      await repo.save(r1);

      const list = await repo.list();
      expect(list.map((r) => r.id)).toEqual(["repo-001", "repo-002"]);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it("planRegistry.list() returns empty array and saved records", async () => {
    const tmp = await makeTempDir();
    try {
      const plans = new FilePlanRegistry(tmp);
      const empty = await plans.list();
      expect(empty).toEqual([]);

      const p1: PlanRecord = {
        version: 1 as const,
        id: "plan-001",
        title: "Test Plan",
        goal: "test goal",
        status: "draft" as const,
        repositories: [
          {
            repositoryId: "repo-001",
            role: "executable" as const,
            access: "read_write" as const,
            mountAlias: "main"
          }
        ],
        primaryExecutableRepositoryId: "repo-001",
        graphSource: "digraph G { start -> exit }",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      };

      await plans.save(p1);
      const list = await plans.list();
      expect(list.map((p) => p.id)).toEqual(["plan-001"]);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it("runRegistry.list() returns all runs regardless of status and listActiveRuns filters", async () => {
    const tmp = await makeTempDir();
    try {
      const runs = new FileRunRegistry(tmp);

      const fixtures: RunRecord[] = [
        {
          version: 1 as const,
          id: "run-001",
          planId: "plan-001",
          status: "queued" as const,
          attempt: 1,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z"
        },
        {
          version: 1 as const,
          id: "run-002",
          planId: "plan-001",
          status: "running" as const,
          attempt: 1,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z"
        },
        {
          version: 1 as const,
          id: "run-003",
          planId: "plan-001",
          status: "paused" as const,
          attempt: 1,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z"
        },
        {
          version: 1 as const,
          id: "run-004",
          planId: "plan-001",
          status: "completed" as const,
          attempt: 1,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z"
        },
        {
          version: 1 as const,
          id: "run-005",
          planId: "plan-001",
          status: "failed" as const,
          attempt: 1,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z"
        },
        {
          version: 1 as const,
          id: "run-006",
          planId: "plan-001",
          status: "canceled" as const,
          attempt: 1,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z"
        }
      ];

      for (const f of fixtures) {
        await runs.save(f);
      }

      const all = await runs.list();
      expect(all.map((r) => r.id)).toEqual(fixtures.map((f) => f.id));

      const active = await runs.listActiveRuns();
      expect(active.map((r) => r.id)).toEqual([
        "run-001",
        "run-002",
        "run-003"
      ]);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });
});
