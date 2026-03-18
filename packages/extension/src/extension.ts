import { chat, commands, type ExtensionContext, workspace } from "vscode";

import { activateAttractor } from "./runtime";
import { CopilotModelGateway } from "./infrastructure/copilot";

export const activate = (context: ExtensionContext): void => {
  const folders = workspace.workspaceFolders;
  const workspaceRoot =
    folders !== undefined && folders.length > 0 && folders[0] !== undefined
      ? folders[0].uri.fsPath
      : context.extensionPath;
  activateAttractor(
    context,
    commands,
    workspaceRoot,
    chat,
    new CopilotModelGateway()
  );
};

export const deactivate = (): void => {
  return;
};
