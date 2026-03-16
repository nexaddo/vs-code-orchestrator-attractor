import path from "node:path";

import { describe, expect, it } from "vitest";

import { FilePlanRegistry } from "../../src/storage/plans";
import { FileRepositoryRegistry } from "../../src/storage/repositories";
import { FileRunRegistry } from "../../src/storage/runs";
import {
  createStorageServices,
  getStorageRoot,
  type StorageServices
} from "../../src/storage/services";

describe("storage services composition", () => {
  it("composes repository and plan registries from one root path", () => {
    const rootDirectory = "C:/tmp/attractor";
    const services = createStorageServices(rootDirectory);

    expect(services.repositoryRegistry).toBeInstanceOf(FileRepositoryRegistry);
    expect(services.planRegistry).toBeInstanceOf(FilePlanRegistry);
    expect(services.runRegistry).toBeInstanceOf(FileRunRegistry);
  });

  it("resolves extension storage roots deterministically", () => {
    expect(getStorageRoot({ storageUri: { fsPath: "C:/tmp/ext" } })).toBe(
      path.resolve("C:/tmp/ext")
    );
  });

  it("returns the shared storage service shape", () => {
    const services: StorageServices = createStorageServices("C:/tmp/attractor");

    expect(Object.keys(services).sort()).toEqual([
      "planRegistry",
      "repositoryRegistry",
      "runRegistry"
    ]);
  });
});
