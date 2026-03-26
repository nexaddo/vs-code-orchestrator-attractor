import { OrchestrationLoop, RunCommandHandler, RunRecoveryService } from "./application";
import type { ModelGateway } from "./application";
import {
  FileGraphRepository,
  FileRepositoryRegistry,
  FileRunRepository,
  FileRunSnapshotStore,
  FileWorktreeLeaseStore,
  GitWorktreeManager,
  NdjsonEventLog,
  NoOpEventPublisher,
  OrphanWorktreeRecovery,
  registerChatParticipant,
  WebviewBridge,
  type ChatApiLike
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

class NoOpModelGateway implements ModelGateway {
  async send(): Promise<string> {
    return "";
  }
  async stream(): Promise<void> {
    return;
  }
}

export interface AttractorContainer {
  runCommandHandler: RunCommandHandler;
  repositoryRegistry: FileRepositoryRegistry;
  graphRepo: FileGraphRepository;
  leaseStore: FileWorktreeLeaseStore;
  orchestrationLoop: OrchestrationLoop;
  webviewBridge: WebviewBridge;
  orphanRecovery: OrphanWorktreeRecovery;
  runRecovery: RunRecoveryService;
}

export function createContainer(
  workspaceRoot: string,
  modelGateway: ModelGateway = new NoOpModelGateway()
): AttractorContainer {
  const publisher = new NoOpEventPublisher();
  const runRepo = new FileRunRepository(workspaceRoot);
  const graphRepo = new FileGraphRepository(workspaceRoot);
  const leaseStore = new FileWorktreeLeaseStore(workspaceRoot);
  const eventLog = new NdjsonEventLog(workspaceRoot);
  const snapshotStore = new FileRunSnapshotStore(workspaceRoot);
  const worktreeManager = new GitWorktreeManager(workspaceRoot);
  const repositoryRegistry = new FileRepositoryRegistry(workspaceRoot);
  const orchestrationLoop = new OrchestrationLoop(modelGateway);
  const webviewBridge = new WebviewBridge();
  const orphanRecovery = new OrphanWorktreeRecovery(
    workspaceRoot,
    leaseStore,
    eventLog,
    publisher
  );
  const runRecovery = new RunRecoveryService(
    runRepo,
    eventLog,
    snapshotStore,
    publisher
  );

  return {
    runCommandHandler: new RunCommandHandler(
      publisher,
      runRepo,
      eventLog,
      leaseStore,
      worktreeManager,
      snapshotStore
    ),
    repositoryRegistry,
    graphRepo,
    leaseStore,
    orchestrationLoop,
    webviewBridge,
    orphanRecovery,
    runRecovery
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
      void (async () => {
        const run = await container.runCommandHandler.startRun({
          planId: "",
          graphId: "",
          correlationId: crypto.randomUUID()
        });
        if (run.graphId.length > 0) {
          const graph = await container.graphRepo.find(run.graphId);
          const lease = await container.leaseStore.findByRunId(run.id);
          if (graph !== undefined && lease !== undefined) {
            void container.orchestrationLoop.execute({
              runId: run.id,
              graph,
              worktreePath: lease.worktreePath,
              onStateUpdate: (state) => {
                container.webviewBridge.postOrchestrationState(state);
              }
            });
          }
        }
      })();
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
  workspaceRoot: string,
  chatApi?: ChatApiLike,
  modelGateway?: ModelGateway
): void => {
  const container = createContainer(workspaceRoot, modelGateway);
  const disposables = registerAttractorCommands(commandsApi, container);
  context.subscriptions.push(...disposables);
  if (chatApi !== undefined) {
    registerChatParticipant(chatApi, context);
  }
  // Silently sweep orphaned worktree leases on every activation
  void container.orphanRecovery.run();
  // Resume any runs that were in-flight when the extension was last shut down
  void container.runRecovery.recover();
};
