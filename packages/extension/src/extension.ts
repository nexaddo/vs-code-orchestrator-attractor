import { commands, type ExtensionContext } from "vscode";

import { activateAttractor } from "./runtime";

export const activate = (context: ExtensionContext): void => {
  activateAttractor(context, commands);
};

export const deactivate = (): void => {
  return;
};
