import { RunCommandHandler } from "./application";
import { NoOpEventPublisher } from "./infrastructure";

export const ATTRACTOR_HELLO_COMMAND = "attractor.hello";
export const ATTRACTOR_RUN_START_COMMAND = "attractor.run.start";
export const ATTRACTOR_RUN_CANCEL_COMMAND = "attractor.run.cancel";
export const ATTRACTOR_PLAN_CREATE_COMMAND = "attractor.plan.create";

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
}

export function createContainer(): AttractorContainer {
  const publisher = new NoOpEventPublisher();
  return {
    runCommandHandler: new RunCommandHandler(publisher)
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
      void container.runCommandHandler.startRun({
        planId: "",
        correlationId: crypto.randomUUID()
      });
    }),
    commandsApi.registerCommand(ATTRACTOR_RUN_CANCEL_COMMAND, () => {
      return;
    }),
    commandsApi.registerCommand(ATTRACTOR_PLAN_CREATE_COMMAND, () => {
      return;
    })
  ];
};

export const activateAttractor = (
  context: ExtensionContextLike,
  commandsApi: CommandsApiLike
): void => {
  const container = createContainer();
  const disposables = registerAttractorCommands(commandsApi, container);
  context.subscriptions.push(...disposables);
};
