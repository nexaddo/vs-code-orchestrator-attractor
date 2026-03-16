import {
  createStorageServices,
  getStorageRoot,
  type StorageServices
} from "./storage/services";

export const ATTRACTOR_HELLO_COMMAND = "attractor.hello";

export interface DisposableLike {
  dispose(): void;
}

export interface CommandsApiLike {
  registerCommand(commandId: string, callback: () => void): DisposableLike;
}

export interface ExtensionContextLike {
  subscriptions: DisposableLike[];
  storageUri?: {
    fsPath: string;
  };
  globalStorageUri?: {
    fsPath: string;
  };
}

// Re-export StorageServices so callers (tests, future consumers) can import it
// from a single runtime entry point rather than reaching into storage internals.
export type { StorageServices as StorageServicesLike };

export interface RuntimeDependencies {
  createStorageServices?: (rootDirectory: string) => StorageServices;
  storageRoot?: string;
}

export const registerAttractorCommands = (
  commandsApi: CommandsApiLike
): DisposableLike[] => {
  return [
    commandsApi.registerCommand(ATTRACTOR_HELLO_COMMAND, () => {
      return;
    })
  ];
};

export const activateAttractor = (
  context: ExtensionContextLike,
  commandsApi: CommandsApiLike,
  dependencies: RuntimeDependencies = {}
): void => {
  const storageRoot = dependencies.storageRoot ?? getStorageRoot(context);

  if (storageRoot) {
    const buildStorageServices =
      dependencies.createStorageServices ??
      ((rootDirectory: string): StorageServices =>
        createStorageServices(rootDirectory));

    // v1 seam: storage services are constructed to validate the seam exists.
    // The result is intentionally not wired to any consumer yet — runtime
    // orchestration is deferred to M2. Replace this with assignment once a
    // consumer (e.g. command handler or orchestrator) is introduced.
    buildStorageServices(storageRoot);
  }

  const disposables = registerAttractorCommands(commandsApi);
  context.subscriptions.push(...disposables);
};
