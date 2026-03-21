import { commands, type ExtensionContext } from "vscode";

import { activateAttractor, type WindowApiLike } from "./runtime";

/**
 * Build a WindowApiLike adapter from the VS Code window namespace.
 *
 * The project's vscode type package (1.1.37) pre-dates
 * `window.registerWebviewViewProvider` so we import the function at
 * runtime from the real VS Code API and adapt it to our testable seam.
 */
const createWindowApi = (): WindowApiLike => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const vscodeWindow = require("vscode").window as {
    registerWebviewViewProvider(
      viewType: string,
      provider: { resolveWebviewView(view: unknown): void },
      options?: unknown
    ): { dispose(): void };
  };
  return {
    registerWebviewViewProvider(viewType, provider) {
      return vscodeWindow.registerWebviewViewProvider(viewType, {
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
