import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { RunRecord } from "@attractor/shared";
import { describe, expect, it } from "vitest";

import { FileRunRegistry } from "../../../src/storage/runs";

const fixturesDirectory = path.resolve(
  __dirname,
  "../../../../../test/fixtures/contracts/runs"
);

const loadFixture = async (relativePath: string): Promise<unknown> => {
  const fullPath = path.join(fixturesDirectory, relativePath);
  return JSON.parse(await readFile(fullPath, "utf8")) as unknown;
};

const createRecord = async (): Promise<RunRecord> => {
  return (await loadFixture("valid/minimal.json")) as RunRecord;
};

const getRunsDirectory = (rootDirectory: string): string => {
  return path.join(rootDirectory, "storage", "runs");
};

describe("FileRunRegistry", () => {
  it("creates storage directories and round-trips a saved run", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileRunRegistry(rootDirectory);
      const record = await createRecord();

      await registry.save(record);

      const filePath = path.join(
        getRunsDirectory(rootDirectory),
        `${record.id}.json`
      );

      await expect(readFile(filePath, "utf8")).resolves.toContain(
        '"id": "run_release_prep_attempt_1"'
      );
      await expect(registry.getById(record.id)).resolves.toEqual(record);
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("returns null when a run id does not exist", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileRunRegistry(rootDirectory);

      await expect(registry.getById("missing_run")).resolves.toBeNull();
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("returns an empty list when storage has not been created yet", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileRunRegistry(rootDirectory);

      await expect(registry.list()).resolves.toEqual([]);
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("overwrites an existing run record when saving the same id", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileRunRegistry(rootDirectory);
      const record = await createRecord();

      await registry.save(record);
      await registry.save({
        ...record,
        status: "running",
        updatedAt: "2026-03-10T00:06:00Z"
      });

      await expect(registry.getById(record.id)).resolves.toEqual({
        ...record,
        status: "running",
        updatedAt: "2026-03-10T00:06:00Z"
      });
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("lists persisted runs in deterministic id order", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileRunRegistry(rootDirectory);
      const alpha = await createRecord();
      const beta: RunRecord = {
        ...alpha,
        id: "run_alpha_attempt_1",
        planId: "plan_alpha"
      };

      await registry.save(alpha);
      await registry.save(beta);

      await expect(registry.list()).resolves.toEqual([beta, alpha]);
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("rejects schema-invalid runs during save", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileRunRegistry(rootDirectory);
      const invalidRecord = (await loadFixture(
        "invalid/zero-attempt.json"
      )) as RunRecord;

      await expect(registry.save(invalidRecord)).rejects.toThrow();
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("fails fast when a persisted run file is invalid", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileRunRegistry(rootDirectory);
      const runsDirectory = getRunsDirectory(rootDirectory);

      await mkdir(runsDirectory, { recursive: true });
      await writeFile(
        path.join(runsDirectory, "broken.json"),
        JSON.stringify(await loadFixture("invalid/zero-attempt.json"))
      );

      await expect(registry.list()).rejects.toThrow("Invalid run record");
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("fails fast when a persisted run file contains malformed JSON", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileRunRegistry(rootDirectory);
      const runsDirectory = getRunsDirectory(rootDirectory);

      await mkdir(runsDirectory, { recursive: true });
      await writeFile(path.join(runsDirectory, "broken.json"), "{");

      await expect(registry.list()).rejects.toThrow("Invalid run JSON");
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("rejects ids containing path separators", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileRunRegistry(rootDirectory);
      const record = await createRecord();

      await expect(
        registry.save({
          ...record,
          id: "nested/run"
        })
      ).rejects.toThrow("path separators");

      await expect(registry.getById("nested/run")).rejects.toThrow(
        "path separators"
      );
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("rejects Windows reserved filenames as ids", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));
    try {
      const registry = new FileRunRegistry(rootDirectory);
      const record = await createRecord();
      await expect(registry.save({ ...record, id: "CON" })).rejects.toThrow(
        "reserved filename"
      );
      await expect(registry.getById("NUL")).rejects.toThrow(
        "reserved filename"
      );
      await expect(registry.save({ ...record, id: "CON." })).rejects.toThrow(
        "reserved filename"
      );
      await expect(registry.getById("NUL ")).rejects.toThrow(
        "reserved filename"
      );
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("list() returns records keyed by their JSON id field, not by filename (v1 known behaviour)", async () => {
    // Documents that there is no filename→id integrity check in v1.
    // A file named "a.json" containing { id: "z" } will be listed as id "z".
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));
    try {
      const registry = new FileRunRegistry(rootDirectory);
      const record = await createRecord();
      // Save a valid record then manually rename the backing file to mismatch the id.
      await registry.save(record);
      const runDir = getRunsDirectory(rootDirectory);
      const { rename } = await import("node:fs/promises");
      await rename(
        path.join(runDir, `${record.id}.json`),
        path.join(runDir, `different_name.json`)
      );
      const listed = await registry.list();
      // list() returns the record as stored in the JSON; the filename is irrelevant.
      expect(listed).toHaveLength(1);
      expect(listed[0]?.id).toBe(record.id);
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });
});
