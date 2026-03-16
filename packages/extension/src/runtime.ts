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

export interface StorageServicesLike {
  repositoryRegistry: {
    save(record: unknown): Promise<unknown>;
    getById(id: string): Promise<unknown>;
    list(): Promise<unknown[]>;
  };
  planRegistry: {
    save(record: unknown): Promise<unknown>;
    getById(id: string): Promise<unknown>;
    list(): Promise<unknown[]>;
  };
  runRegistry: {
    save(record: unknown): Promise<unknown>;
    getById(id: string): Promise<unknown>;
    list(): Promise<unknown[]>;
  };
}

export interface RuntimeDependencies {
  createStorageServices?: (rootDirectory: string) => StorageServicesLike;
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

    buildStorageServices(storageRoot);
  }

  const disposables = registerAttractorCommands(commandsApi);
  context.subscriptions.push(...disposables);
};
