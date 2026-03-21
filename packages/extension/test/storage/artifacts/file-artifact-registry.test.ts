import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { ArtifactRecord } from "@attractor/shared";
import { describe, expect, it } from "vitest";

import { FileArtifactRegistry } from "../../../src/storage/artifacts";

const fixturesDirectory = path.resolve(
  __dirname,
  "../../../../../test/fixtures/contracts/artifacts"
);

const loadFixture = async (relativePath: string): Promise<unknown> => {
  const fullPath = path.join(fixturesDirectory, relativePath);
  return JSON.parse(await readFile(fullPath, "utf8")) as unknown;
};

const createRecord = async (): Promise<ArtifactRecord> => {
  return (await loadFixture("valid/minimal.json")) as ArtifactRecord;
};

const getArtifactsDirectory = (
  rootDirectory: string,
  runId: string
): string => {
  return path.join(rootDirectory, "storage", "runs", runId, "artifacts");
};

describe("FileArtifactRegistry", () => {
  it("creates nested storage directories and round-trips a saved artifact", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileArtifactRegistry(rootDirectory);
      const record = await createRecord();

      await registry.save(record);

      const filePath = path.join(
        getArtifactsDirectory(rootDirectory, record.runId),
        `${record.id}.json`
      );

      await expect(readFile(filePath, "utf8")).resolves.toContain(
        '"id": "art_001"'
      );
      await expect(registry.getById(record.id)).resolves.toEqual(record);
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("returns null when an artifact id does not exist", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileArtifactRegistry(rootDirectory);

      await expect(registry.getById("missing_art")).resolves.toBeNull();
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("returns an empty list when storage has not been created yet", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileArtifactRegistry(rootDirectory);

      await expect(registry.listByRunId("run_001")).resolves.toEqual([]);
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("overwrites an existing record when saving the same id", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileArtifactRegistry(rootDirectory);
      const record = await createRecord();

      await registry.save(record);
      await registry.save({ ...record, title: "updated-auth.md" });

      await expect(registry.getById(record.id)).resolves.toMatchObject({
        id: record.id,
        title: "updated-auth.md"
      });
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("lists artifacts in deterministic id order", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileArtifactRegistry(rootDirectory);
      const alpha = await createRecord();
      const beta: ArtifactRecord = {
        ...alpha,
        id: "art_aaa",
        nodeId: "codergen_2"
      };

      await registry.save(alpha);
      await registry.save(beta);

      const listed = await registry.listByRunId(alpha.runId);
      // "art_001" sorts before "art_aaa"
      expect(listed).toHaveLength(2);
      expect(listed[0]?.id).toBe("art_001");
      expect(listed[1]?.id).toBe("art_aaa");
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("filters by nodeId via listByNodeId", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileArtifactRegistry(rootDirectory);
      const record = await createRecord();
      const other: ArtifactRecord = {
        ...record,
        id: "art_002",
        nodeId: "codergen_2"
      };

      await registry.save(record);
      await registry.save(other);

      await expect(
        registry.listByNodeId(record.runId, "codergen_1")
      ).resolves.toEqual([record]);

      await expect(
        registry.listByNodeId(record.runId, "codergen_2")
      ).resolves.toEqual([other]);
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("rejects schema-invalid records during save", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileArtifactRegistry(rootDirectory);
      const invalidRecord = (await loadFixture(
        "invalid/missing-title.json"
      )) as ArtifactRecord;

      await expect(registry.save(invalidRecord)).rejects.toThrow();
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("fails fast when a persisted file is schema-invalid", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileArtifactRegistry(rootDirectory);
      const dir = getArtifactsDirectory(rootDirectory, "run_001");

      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, "broken.json"),
        JSON.stringify(await loadFixture("invalid/missing-title.json"))
      );

      await expect(registry.listByRunId("run_001")).rejects.toThrow(
        "Invalid artifact record"
      );
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("fails fast when a persisted file contains malformed JSON", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileArtifactRegistry(rootDirectory);
      const dir = getArtifactsDirectory(rootDirectory, "run_001");

      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, "broken.json"), "{");

      await expect(registry.listByRunId("run_001")).rejects.toThrow(
        "Invalid artifact JSON"
      );
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("rejects ids containing path separators", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileArtifactRegistry(rootDirectory);
      const record = await createRecord();

      await expect(
        registry.save({ ...record, runId: "nested/run" })
      ).rejects.toThrow("path separators");

      await expect(
        registry.save({ ...record, id: "nested/art" })
      ).rejects.toThrow("path separators");

      await expect(registry.getById("nested/art")).rejects.toThrow(
        "path separators"
      );
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("rejects Windows reserved filenames as ids", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileArtifactRegistry(rootDirectory);
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
