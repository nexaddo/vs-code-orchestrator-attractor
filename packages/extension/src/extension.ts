import { commands, window, type ExtensionContext } from "vscode";

import { activateAttractor, type WindowApiLike } from "./runtime";

/**
 * Build a WindowApiLike adapter from the VS Code window namespace.
 */
const createWindowApi = (): WindowApiLike => {
  return {
    registerWebviewViewProvider(viewType, provider) {
      return window.registerWebviewViewProvider(viewType, {
        resolveWebviewView(webviewView: unknown) {
          provider.resolveWebviewView(webviewView);
        }
      });
    }
  };
};

export const activate = (context: ExtensionContext): void => {
  activateAttractor(context, commands, { windowApi: createWindowApi() });
};

export const deactivate = (): void => {
  return;
};
