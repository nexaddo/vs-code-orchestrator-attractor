import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { PlanRecord } from "@attractor/shared";
import { describe, expect, it } from "vitest";

import { FilePlanRegistry } from "../../../src/storage/plans";

const fixturesDirectory = path.resolve(
  __dirname,
  "../../../../../test/fixtures/contracts/plans"
);

const loadFixture = async (relativePath: string): Promise<unknown> => {
  const fullPath = path.join(fixturesDirectory, relativePath);
  return JSON.parse(await readFile(fullPath, "utf8")) as unknown;
};

const createRecord = async (): Promise<PlanRecord> => {
  return (await loadFixture("valid/minimal.json")) as PlanRecord;
};

const getPlansDirectory = (rootDirectory: string): string => {
  return path.join(rootDirectory, "storage", "plans");
};

describe("FilePlanRegistry", () => {
  it("creates storage directories and round-trips a saved plan", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FilePlanRegistry(rootDirectory);
      const record = await createRecord();

      await registry.save(record);

      const filePath = path.join(
        getPlansDirectory(rootDirectory),
        `${record.id}.json`
      );

      await expect(readFile(filePath, "utf8")).resolves.toContain(
        '"id": "plan_release_prep"'
      );
      await expect(registry.getById(record.id)).resolves.toEqual(record);
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("returns null when a plan id does not exist", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FilePlanRegistry(rootDirectory);

      await expect(registry.getById("missing_plan")).resolves.toBeNull();
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("returns an empty list when storage has not been created yet", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FilePlanRegistry(rootDirectory);

      await expect(registry.list()).resolves.toEqual([]);
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("overwrites an existing plan record when saving the same id", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FilePlanRegistry(rootDirectory);
      const record = await createRecord();

      await registry.save(record);
      await registry.save({
        ...record,
        title: "Release Prep Updated",
        updatedAt: "2026-03-11T00:00:00Z"
      });

      await expect(registry.getById(record.id)).resolves.toEqual({
        ...record,
        title: "Release Prep Updated",
        updatedAt: "2026-03-11T00:00:00Z"
      });
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("lists persisted plans in deterministic id order", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FilePlanRegistry(rootDirectory);
      const alpha = await createRecord();
      const beta: PlanRecord = {
        ...alpha,
        id: "plan_beta",
        title: "Beta Plan",
        goal: "Prepare docs in the context repo",
        primaryExecutableRepositoryId: "repo_alpha"
      };

      await registry.save(beta);
      await registry.save(alpha);

      await expect(registry.list()).resolves.toEqual([beta, alpha]);
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("rejects schema-invalid plans during save", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FilePlanRegistry(rootDirectory);
      const invalidRecord = (await loadFixture(
        "invalid/zero-writable-repos.json"
      )) as PlanRecord;

      await expect(registry.save(invalidRecord)).rejects.toThrow();
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("fails fast when a persisted plan file is invalid", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FilePlanRegistry(rootDirectory);
      const plansDirectory = getPlansDirectory(rootDirectory);

      await mkdir(plansDirectory, { recursive: true });
      await writeFile(
        path.join(plansDirectory, "broken.json"),
        JSON.stringify(await loadFixture("invalid/zero-writable-repos.json"))
      );

      await expect(registry.list()).rejects.toThrow("Invalid plan record");
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("fails fast when a persisted plan file contains malformed JSON", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FilePlanRegistry(rootDirectory);
      const plansDirectory = getPlansDirectory(rootDirectory);

      await mkdir(plansDirectory, { recursive: true });
      await writeFile(path.join(plansDirectory, "broken.json"), "{");

      await expect(registry.list()).rejects.toThrow("Invalid plan JSON");
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("rejects ids containing path separators", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FilePlanRegistry(rootDirectory);
      const record = await createRecord();

      await expect(
        registry.save({
          ...record,
          id: "nested/plan"
        })
      ).rejects.toThrow("path separators");

      await expect(registry.getById("nested/plan")).rejects.toThrow(
        "path separators"
      );
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });
});
