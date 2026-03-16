import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { RepositoryRecord } from "@attractor/shared";
import { describe, expect, it } from "vitest";

import { FileRepositoryRegistry } from "../../../src/storage/repositories";

const fixturesDirectory = path.resolve(
  __dirname,
  "../../../../../test/fixtures/contracts/repositories"
);

const loadFixture = async (relativePath: string): Promise<unknown> => {
  const fullPath = path.join(fixturesDirectory, relativePath);
  return JSON.parse(await readFile(fullPath, "utf8")) as unknown;
};

const createRecord = async (): Promise<RepositoryRecord> => {
  return (await loadFixture("valid/minimal.json")) as RepositoryRecord;
};

const getRepositoriesDirectory = (rootDirectory: string): string => {
  return path.join(rootDirectory, "storage", "repositories");
};

describe("FileRepositoryRegistry", () => {
  it("creates storage directories and round-trips a saved repository", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileRepositoryRegistry(rootDirectory);
      const record = await createRecord();

      await registry.save(record);

      const filePath = path.join(
        getRepositoriesDirectory(rootDirectory),
        `${record.id}.json`
      );

      await expect(readFile(filePath, "utf8")).resolves.toContain(
        '"id": "repo_alpha"'
      );
      await expect(registry.getById(record.id)).resolves.toEqual(record);
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("returns null when a repository id does not exist", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileRepositoryRegistry(rootDirectory);

      await expect(registry.getById("missing_repo")).resolves.toBeNull();
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("returns an empty list when storage has not been created yet", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileRepositoryRegistry(rootDirectory);

      await expect(registry.list()).resolves.toEqual([]);
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("overwrites an existing repository record when saving the same id", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileRepositoryRegistry(rootDirectory);
      const record = await createRecord();

      await registry.save(record);
      await registry.save({
        ...record,
        name: "repo-alpha-renamed",
        labels: ["workspace", "renamed"]
      });

      await expect(registry.getById(record.id)).resolves.toEqual({
        ...record,
        name: "repo-alpha-renamed",
        labels: ["workspace", "renamed"]
      });
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("lists persisted repositories in deterministic id order", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileRepositoryRegistry(rootDirectory);
      const alpha = await createRecord();
      const beta: RepositoryRecord = {
        ...alpha,
        id: "repo_beta",
        name: "repo-beta",
        rootUri: "file:///workspace/repo-beta",
        labels: ["workspace", "secondary"]
      };

      await registry.save(beta);
      await registry.save(alpha);

      await expect(registry.list()).resolves.toEqual([alpha, beta]);
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("rejects schema-invalid records during save", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileRepositoryRegistry(rootDirectory);
      const invalidRecord = (await loadFixture(
        "invalid/missing-version.json"
      )) as RepositoryRecord;

      await expect(registry.save(invalidRecord)).rejects.toThrow();
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("fails fast when a persisted repository file is invalid", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileRepositoryRegistry(rootDirectory);
      const repositoriesDirectory = getRepositoriesDirectory(rootDirectory);

      await mkdir(repositoriesDirectory, { recursive: true });
      await writeFile(
        path.join(repositoriesDirectory, "broken.json"),
        JSON.stringify(await loadFixture("invalid/missing-version.json"))
      );

      await expect(registry.list()).rejects.toThrow(
        "Invalid repository record"
      );
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("fails fast when a persisted repository file contains malformed JSON", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileRepositoryRegistry(rootDirectory);
      const repositoriesDirectory = getRepositoriesDirectory(rootDirectory);

      await mkdir(repositoriesDirectory, { recursive: true });
      await writeFile(path.join(repositoriesDirectory, "broken.json"), "{");

      await expect(registry.list()).rejects.toThrow("Invalid repository JSON");
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("rejects ids containing path separators", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));

    try {
      const registry = new FileRepositoryRegistry(rootDirectory);
      const record = await createRecord();

      await expect(
        registry.save({
          ...record,
          id: "nested/repo"
        })
      ).rejects.toThrow("path separators");

      await expect(registry.getById("nested/repo")).rejects.toThrow(
        "path separators"
      );
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("rejects Windows reserved filenames as ids", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));
    try {
      const registry = new FileRepositoryRegistry(rootDirectory);
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

  it("list() returns records keyed by their JSON id field, not by filename (v1 known behaviour)", async () => {
    // Documents that there is no filename→id integrity check in v1.
    // A file named "a.json" containing { id: "z" } will be listed as id "z".
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "attractor-"));
    try {
      const registry = new FileRepositoryRegistry(rootDirectory);
      const record = await createRecord();
      // Save a valid record then manually rename the backing file to mismatch the id.
      await registry.save(record);
      const repoDir = getRepositoriesDirectory(rootDirectory);
      const { rename } = await import("node:fs/promises");
      await rename(
        path.join(repoDir, `${record.id}.json`),
        path.join(repoDir, `different_name.json`)
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
