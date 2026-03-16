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

export interface ExtensionStorageUriLike {
  fsPath: string;
}

export interface ExtensionStorageContextLike {
  storageUri?: ExtensionStorageUriLike;
  globalStorageUri?: ExtensionStorageUriLike;
}

export interface StorageServices {
  repositoryRegistry: RepositoryRegistry;
  planRegistry: PlanRegistry;
  runRegistry: RunRegistry;
}

export const createStorageServices = (
  rootDirectory: string
): StorageServices => {
  return {
    repositoryRegistry: new FileRepositoryRegistry(rootDirectory),
    planRegistry: new FilePlanRegistry(rootDirectory),
    runRegistry: new FileRunRegistry(rootDirectory)
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
