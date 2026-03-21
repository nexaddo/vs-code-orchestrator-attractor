import { WebviewInboundMessageSchema } from "@attractor/shared";

import {
  createStorageServices,
  getStorageRoot,
  type StorageServices
} from "./storage/services";
import {
  handleWebviewMessage,
  type WebviewPanelLike
} from "./dashboard/bridge";

export const ATTRACTOR_HELLO_COMMAND = "attractor.hello";
export const ATTRACTOR_DASHBOARD_VIEW_TYPE = "attractor.dashboard";
export const ATTRACTOR_WEBVIEW_BUNDLE_PATH = [
  "packages",
  "webview",
  "dist",
  "bundle"
] as const;

export interface DisposableLike {
  dispose(): void;
}

export interface CommandsApiLike {
  registerCommand(commandId: string, callback: () => void): DisposableLike;
}

export interface ExtensionContextLike {
  subscriptions: DisposableLike[];
  extensionUri?: {
    fsPath: string;
  };
  storageUri?: {
    fsPath: string;
  };
  globalStorageUri?: {
    fsPath: string;
  };
  onWebviewMessage?: (raw: unknown, panel: WebviewPanelLike) => Promise<void>;
}

// Re-export seam types so callers can import them without reaching into internals.
export type { StorageServices as StorageServicesLike };
export type { WebviewPanelLike };

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

  let services: StorageServices | null = null;

  if (storageRoot) {
    const buildStorageServices =
      dependencies.createStorageServices ??
      ((rootDirectory: string): StorageServices =>
        createStorageServices(rootDirectory));

    services = buildStorageServices(storageRoot);
  }

  const disposables = registerAttractorCommands(commandsApi);
  context.subscriptions.push(...disposables);

  // Expose a message handler so a webview panel can be wired in after
  // activation (e.g. when the user opens the dashboard panel).  The handler
  // is a no-op when storage services are unavailable.
  context.onWebviewMessage = async (
    raw: unknown,
    panel: WebviewPanelLike
  ): Promise<void> => {
    if (!services) {
      return;
    }
    const parsed = WebviewInboundMessageSchema.safeParse(raw);
    if (!parsed.success) {
      return;
    }
    try {
      await handleWebviewMessage(parsed.data, services, panel);
    } catch (error) {
      console.error("Failed to handle webview message:", error);
    }
  };
};
