import path from "node:path";

import { describe, expect, it } from "vitest";

import { FilePlanRegistry } from "../../src/storage/plans";
import { FileRepositoryRegistry } from "../../src/storage/repositories";
import { FileRunRegistry } from "../../src/storage/runs";
import { FileEventLog } from "../../src/storage/events/file-event-log";
import { EventLogSnapshotProjector } from "../../src/storage/snapshots/snapshot-projector";
import { FileMilestoneRunRegistry } from "../../src/storage/milestone-runs";
import { FileMilestoneRegistry } from "../../src/storage/milestones";
import { FileArtifactRegistry } from "../../src/storage/artifacts";
import {
  createStorageServices,
  getStorageRoot,
  type StorageServices
} from "../../src/storage/services";

describe("storage services composition", () => {
  it("composes repository, plan, and run registries from one root path", () => {
    const rootDirectory = "C:/tmp/attractor";
    const services = createStorageServices(rootDirectory);

    expect(services.repositoryRegistry).toBeInstanceOf(FileRepositoryRegistry);
    expect(services.planRegistry).toBeInstanceOf(FilePlanRegistry);
    expect(services.runRegistry).toBeInstanceOf(FileRunRegistry);
  });

  it("wires event log and snapshot projector", () => {
    const rootDirectory = "C:/tmp/attractor";
    const services = createStorageServices(rootDirectory);

    expect(services.eventLog).toBeInstanceOf(FileEventLog);
    expect(services.snapshotProjector).toBeInstanceOf(
      EventLogSnapshotProjector
    );
  });

  it("wires milestone run registry, milestone registry, and artifact registry", () => {
    const rootDirectory = "C:/tmp/attractor";
    const services = createStorageServices(rootDirectory);

    expect(services.milestoneRunRegistry).toBeInstanceOf(
      FileMilestoneRunRegistry
    );
    expect(services.milestoneRegistry).toBeInstanceOf(FileMilestoneRegistry);
    expect(services.artifactRegistry).toBeInstanceOf(FileArtifactRegistry);
  });

  it("resolves extension storage roots deterministically", () => {
    expect(getStorageRoot({ storageUri: { fsPath: "C:/tmp/ext" } })).toBe(
      path.resolve("C:/tmp/ext")
    );
  });

  it("returns the shared storage service shape", () => {
    const services: StorageServices = createStorageServices("C:/tmp/attractor");

    expect(Object.keys(services).sort()).toEqual([
      "artifactRegistry",
      "eventLog",
      "milestoneRegistry",
      "milestoneRunRegistry",
      "planRegistry",
      "repositoryRegistry",
      "runRegistry",
      "snapshotProjector"
    ]);
  });
});
