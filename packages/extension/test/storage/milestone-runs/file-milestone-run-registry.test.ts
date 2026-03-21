import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { MilestoneRunRecord } from "@attractor/shared";
import { describe, expect, it } from "vitest";

import { FileMilestoneRunRegistry } from "../../../src/storage/milestone-runs";

const fixturesDirectory = path.resolve(
  __dirname,
  "../../../../../test/fixtures/contracts/milestone-runs"
);

const loadFixture = async (relativePath: string): Promise<unknown> => {
  const fullPath = path.join(fixturesDirectory, relativePath);
  return JSON.parse(await readFile(fullPath, "utf8")) as unknown;
};

const createRecord = async (): Promise<MilestoneRunRecord> => {
  return (await loadFixture("valid/minimal.json")) as MilestoneRunRecord;
};

const getMilestoneRunsDirectory = (
  rootDirectory: string,
  runId: string
): string => {
  return path.join(rootDirectory, "storage", "runs", runId, "milestone-runs");
};

describe("FileMilestoneRunRegistry", () => {
  it("creates nested storage directories and round-trips a saved milestone run", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileMilestoneRunRegistry(rootDirectory);
      const record = await createRecord();

      await registry.save(record);

      const filePath = path.join(
        getMilestoneRunsDirectory(rootDirectory, record.runId),
        `${record.id}.json`
      );

      await expect(readFile(filePath, "utf8")).resolves.toContain(
        '"id": "mr_001"'
      );
      await expect(registry.getById(record.id)).resolves.toEqual(record);
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("returns null when a milestone run id does not exist", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileMilestoneRunRegistry(rootDirectory);

      await expect(registry.getById("missing_mr")).resolves.toBeNull();
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("returns an empty list when storage has not been created yet", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileMilestoneRunRegistry(rootDirectory);

      await expect(registry.listByRunId("run_001")).resolves.toEqual([]);
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("overwrites an existing record when saving the same id", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileMilestoneRunRegistry(rootDirectory);
      const record = await createRecord();

      await registry.save(record);
      await registry.save({
        ...record,
        status: "running",
        endedAt: undefined
      });

      await expect(registry.getById(record.id)).resolves.toMatchObject({
        id: record.id,
        status: "running"
      });
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("lists milestone runs in deterministic id order", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileMilestoneRunRegistry(rootDirectory);
      const alpha = await createRecord();
      const beta: MilestoneRunRecord = {
        ...alpha,
        id: "mr_aaa",
        milestoneId: "ms_002"
      };

      await registry.save(alpha);
      await registry.save(beta);

      const listed = await registry.listByRunId(alpha.runId);
      // "mr_001" sorts after "mr_aaa"
      expect(listed).toHaveLength(2);
      expect(listed[0]?.id).toBe("mr_001");
      expect(listed[1]?.id).toBe("mr_aaa");
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("filters by milestoneId via listByMilestoneId", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileMilestoneRunRegistry(rootDirectory);
      const record = await createRecord();
      const other: MilestoneRunRecord = {
        ...record,
        id: "mr_002",
        milestoneId: "ms_002"
      };

      await registry.save(record);
      await registry.save(other);

      await expect(
        registry.listByMilestoneId(record.runId, "ms_001")
      ).resolves.toEqual([record]);

      await expect(
        registry.listByMilestoneId(record.runId, "ms_002")
      ).resolves.toEqual([other]);
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("rejects schema-invalid records during save", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileMilestoneRunRegistry(rootDirectory);
      const invalidRecord = (await loadFixture(
        "invalid/bad-status.json"
      )) as MilestoneRunRecord;

      await expect(registry.save(invalidRecord)).rejects.toThrow();
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("fails fast when a persisted file is schema-invalid", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileMilestoneRunRegistry(rootDirectory);
      const dir = getMilestoneRunsDirectory(rootDirectory, "run_001");

      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, "broken.json"),
        JSON.stringify(await loadFixture("invalid/bad-status.json"))
      );

      await expect(registry.listByRunId("run_001")).rejects.toThrow(
        "Invalid milestone run record"
      );
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("fails fast when a persisted file contains malformed JSON", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileMilestoneRunRegistry(rootDirectory);
      const dir = getMilestoneRunsDirectory(rootDirectory, "run_001");

      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, "broken.json"), "{");

      await expect(registry.listByRunId("run_001")).rejects.toThrow(
        "Invalid milestone run JSON"
      );
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("rejects ids containing path separators", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileMilestoneRunRegistry(rootDirectory);
      const record = await createRecord();

      await expect(
        registry.save({ ...record, runId: "nested/run" })
      ).rejects.toThrow("path separators");

      await expect(
        registry.save({ ...record, id: "nested/mr" })
      ).rejects.toThrow("path separators");

      await expect(registry.getById("nested/mr")).rejects.toThrow(
        "path separators"
      );
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("rejects Windows reserved filenames as ids", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileMilestoneRunRegistry(rootDirectory);
      const record = await createRecord();

      await expect(registry.save({ ...record, id: "CON" })).rejects.toThrow(
        "reserved filename"
      );

      await expect(registry.getById("NUL")).rejects.toThrow(
        "reserved filename"
      );
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });
});
