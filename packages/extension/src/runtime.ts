import { RunCommandHandler } from "./application";
import {
  FileGraphRepository,
  FileRepositoryRegistry,
  FileRunRepository,
  FileWorktreeLeaseStore,
  GitWorktreeManager,
  NdjsonEventLog,
  NoOpEventPublisher
} from "./infrastructure";

export const ATTRACTOR_HELLO_COMMAND = "attractor.hello";
export const ATTRACTOR_RUN_START_COMMAND = "attractor.run.start";
export const ATTRACTOR_RUN_CANCEL_COMMAND = "attractor.run.cancel";
export const ATTRACTOR_PLAN_CREATE_COMMAND = "attractor.plan.create";
export const ATTRACTOR_REPO_ADD_COMMAND = "attractor.repo.add";
export const ATTRACTOR_REPO_REMOVE_COMMAND = "attractor.repo.remove";
export const ATTRACTOR_REPO_LIST_COMMAND = "attractor.repo.list";

export interface DisposableLike {
  dispose(): void;
}

export interface CommandsApiLike {
  registerCommand(commandId: string, callback: () => void): DisposableLike;
}

export interface ExtensionContextLike {
  subscriptions: DisposableLike[];
}

export interface AttractorContainer {
  runCommandHandler: RunCommandHandler;
  repositoryRegistry: FileRepositoryRegistry;
}

export function createContainer(workspaceRoot: string): AttractorContainer {
  const publisher = new NoOpEventPublisher();
  const runRepo = new FileRunRepository(workspaceRoot);
  const graphRepo = new FileGraphRepository(workspaceRoot);
  const leaseStore = new FileWorktreeLeaseStore(workspaceRoot);
  const eventLog = new NdjsonEventLog(workspaceRoot);
  const worktreeManager = new GitWorktreeManager(workspaceRoot);
  const repositoryRegistry = new FileRepositoryRegistry(workspaceRoot);

  // graphRepo is available for M3+ use (stored in container scope)
  void graphRepo;

  return {
    runCommandHandler: new RunCommandHandler(
      publisher,
      runRepo,
      eventLog,
      leaseStore,
      worktreeManager
    ),
    repositoryRegistry
  };
}

export const registerAttractorCommands = (
  commandsApi: CommandsApiLike,
  container: AttractorContainer
): DisposableLike[] => {
  return [
    commandsApi.registerCommand(ATTRACTOR_HELLO_COMMAND, () => {
      return;
    }),
    commandsApi.registerCommand(ATTRACTOR_RUN_START_COMMAND, () => {
      // planId and graphId will be provided via args in M4+
      void container.runCommandHandler.startRun({
        planId: "",
        graphId: "",
        correlationId: crypto.randomUUID()
      });
    }),
    commandsApi.registerCommand(ATTRACTOR_RUN_CANCEL_COMMAND, () => {
      return;
    }),
    commandsApi.registerCommand(ATTRACTOR_PLAN_CREATE_COMMAND, () => {
      return;
    }),
    commandsApi.registerCommand(ATTRACTOR_REPO_ADD_COMMAND, () => {
      return;
    }),
    commandsApi.registerCommand(ATTRACTOR_REPO_REMOVE_COMMAND, () => {
      return;
    }),
    commandsApi.registerCommand(ATTRACTOR_REPO_LIST_COMMAND, () => {
      void container.repositoryRegistry.list();
    })
  ];
};

export const activateAttractor = (
  context: ExtensionContextLike,
  commandsApi: CommandsApiLike,
  workspaceRoot: string
): void => {
  const container = createContainer(workspaceRoot);
  const disposables = registerAttractorCommands(commandsApi, container);
  context.subscriptions.push(...disposables);
};
