import path from "node:path";

import {
  FilePlanRegistry,
  type PlanRegistry
} from "./plans/file-plan-registry";
import {
  FileRepositoryRegistry,
  type RepositoryRegistry
} from "./repositories/file-repository-registry";
import { FileRunRegistry, type RunRegistry } from "./runs/file-run-registry";
import { FileEventLog } from "./events/file-event-log";
import { type EventLog } from "./events/index";
import { EventLogSnapshotProjector } from "./snapshots/snapshot-projector";
import { type SnapshotProjector } from "./snapshots/index";
import {
  FileMilestoneRunRegistry,
  type MilestoneRunRegistry
} from "./milestone-runs/file-milestone-run-registry";
import {
  FileMilestoneRegistry,
  type MilestoneRegistry
} from "./milestones/file-milestone-registry";
import {
  FileArtifactRegistry,
  type ArtifactRegistry
} from "./artifacts/file-artifact-registry";

export interface ExtensionStorageUriLike {
  fsPath: string;
}

export interface ExtensionStorageContextLike {
  storageUri?: ExtensionStorageUriLike | undefined;
  globalStorageUri?: ExtensionStorageUriLike | undefined;
}

export interface StorageServices {
  repositoryRegistry: RepositoryRegistry;
  planRegistry: PlanRegistry;
  runRegistry: RunRegistry;
  eventLog: EventLog;
  snapshotProjector: SnapshotProjector;
  milestoneRunRegistry: MilestoneRunRegistry;
  milestoneRegistry: MilestoneRegistry;
  artifactRegistry: ArtifactRegistry;
}

export const createStorageServices = (
  rootDirectory: string
): StorageServices => {
  const eventLog = new FileEventLog(rootDirectory);
  return {
    repositoryRegistry: new FileRepositoryRegistry(rootDirectory),
    planRegistry: new FilePlanRegistry(rootDirectory),
    runRegistry: new FileRunRegistry(rootDirectory),
    eventLog,
    snapshotProjector: new EventLogSnapshotProjector(eventLog),
    milestoneRunRegistry: new FileMilestoneRunRegistry(rootDirectory),
    milestoneRegistry: new FileMilestoneRegistry(rootDirectory),
    artifactRegistry: new FileArtifactRegistry(rootDirectory)
  };
};

export const getStorageRoot = (
  context: ExtensionStorageContextLike
): string | null => {
  const storageUri = context.storageUri ?? context.globalStorageUri;

  if (!storageUri) {
    return null;
  }

  return path.resolve(storageUri.fsPath);
};
