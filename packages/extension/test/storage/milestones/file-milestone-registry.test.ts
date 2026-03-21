import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { MilestoneRecord } from "@attractor/shared";
import { describe, expect, it } from "vitest";

import { FileMilestoneRegistry } from "../../../src/storage/milestones";

const fixturesDirectory = path.resolve(
  __dirname,
  "../../../../../test/fixtures/contracts/milestones"
);

const loadFixture = async (relativePath: string): Promise<unknown> => {
  const fullPath = path.join(fixturesDirectory, relativePath);
  return JSON.parse(await readFile(fullPath, "utf8")) as unknown;
};

const createRecord = async (): Promise<MilestoneRecord> => {
  return (await loadFixture("valid/minimal.json")) as MilestoneRecord;
};

const getMilestonesDirectory = (rootDirectory: string): string => {
  return path.join(rootDirectory, "storage", "milestones");
};

describe("FileMilestoneRegistry", () => {
  it("creates nested storage directories and round-trips a saved milestone", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileMilestoneRegistry(rootDirectory);
      const record = await createRecord();

      await registry.save(record);

      const filePath = path.join(
        getMilestonesDirectory(rootDirectory),
        `${record.id}.json`
      );

      await expect(readFile(filePath, "utf8")).resolves.toContain(
        '"id": "ms_001"'
      );
      await expect(registry.getById(record.id)).resolves.toEqual(record);
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("returns null when a milestone id does not exist", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileMilestoneRegistry(rootDirectory);

      await expect(registry.getById("missing_ms")).resolves.toBeNull();
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("returns an empty list when storage has not been created yet", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileMilestoneRegistry(rootDirectory);

      await expect(registry.list()).resolves.toEqual([]);
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("overwrites an existing record when saving the same id", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileMilestoneRegistry(rootDirectory);
      const record = await createRecord();

      await registry.save(record);
      await registry.save({
        ...record,
        status: "ready"
      });

      await expect(registry.getById(record.id)).resolves.toMatchObject({
        id: record.id,
        status: "ready"
      });
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("lists milestones in deterministic id order", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileMilestoneRegistry(rootDirectory);
      const alpha = await createRecord();
      const beta: MilestoneRecord = {
        ...alpha,
        id: "ms_aaa"
      };

      await registry.save(alpha);
      await registry.save(beta);

      const listed = await registry.list();
      // "ms_001" sorts after "ms_aaa"
      expect(listed).toHaveLength(2);
      expect(listed[0]?.id).toBe("ms_001");
      expect(listed[1]?.id).toBe("ms_aaa");
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("filters by planId via listByPlanId", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileMilestoneRegistry(rootDirectory);
      const record = await createRecord();
      const other: MilestoneRecord = {
        ...record,
        id: "ms_002",
        planId: "plan_002"
      };

      await registry.save(record);
      await registry.save(other);

      await expect(registry.listByPlanId("plan_001")).resolves.toEqual([
        record
      ]);

      await expect(registry.listByPlanId("plan_002")).resolves.toEqual([other]);
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("rejects schema-invalid records during save", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileMilestoneRegistry(rootDirectory);
      const invalidRecord = (await loadFixture(
        "invalid/missing-plan-id.json"
      )) as MilestoneRecord;

      await expect(registry.save(invalidRecord)).rejects.toThrow();
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("fails fast when a persisted file is schema-invalid", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileMilestoneRegistry(rootDirectory);
      const dir = getMilestonesDirectory(rootDirectory);

      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, "broken.json"),
        JSON.stringify(await loadFixture("invalid/missing-plan-id.json"))
      );

      await expect(registry.list()).rejects.toThrow("Invalid milestone record");
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("fails fast when a persisted file contains malformed JSON", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileMilestoneRegistry(rootDirectory);
      const dir = getMilestonesDirectory(rootDirectory);

      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, "broken.json"), "{");

      await expect(registry.list()).rejects.toThrow("Invalid milestone JSON");
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("rejects ids containing path separators", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileMilestoneRegistry(rootDirectory);
      const record = await createRecord();

      await expect(
        registry.save({ ...record, id: "nested/ms" })
      ).rejects.toThrow("path separators");

      await expect(registry.getById("nested/ms")).rejects.toThrow(
        "path separators"
      );
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("rejects Windows reserved filenames as ids", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileMilestoneRegistry(rootDirectory);
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
