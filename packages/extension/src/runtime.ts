export const ATTRACTOR_HELLO_COMMAND = "attractor.hello";

export interface DisposableLike {
  dispose(): void;
}

export interface CommandsApiLike {
  registerCommand(commandId: string, callback: () => void): DisposableLike;
}

export interface ExtensionContextLike {
  subscriptions: DisposableLike[];
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
  commandsApi: CommandsApiLike
): void => {
  const disposables = registerAttractorCommands(commandsApi);
  context.subscriptions.push(...disposables);
};
