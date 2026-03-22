import { WebviewInboundMessageSchema } from "@attractor/shared";

import {
  createStorageServices,
  getStorageRoot,
  type StorageServices
} from "./storage/services";
import { NoOpModelGateway, type ModelGateway } from "./application/ports";
import {
  handleWebviewMessage,
  type WebviewPanelLike,
  type BridgeOrchestrationContext
} from "./dashboard/bridge";
import {
  AttractorViewProvider,
  type WebviewPostTarget
} from "./dashboard/webview-provider";
import {
  registerChatParticipant,
  type ChatApiLike
} from "./chat/attractor-chat-participant";

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

/**
 * Seam for vscode.window.registerWebviewViewProvider so runtime.ts stays
 * testable without launching an extension host.
 */
export interface WindowApiLike {
  registerWebviewViewProvider(
    viewType: string,
    provider: { resolveWebviewView(view: unknown): void }
  ): DisposableLike;
}

export interface ExtensionContextLike {
  subscriptions: DisposableLike[];
  extensionUri?: {
    fsPath: string;
  };
  storageUri?:
    | {
        fsPath: string;
      }
    | undefined;
  globalStorageUri?:
    | {
        fsPath: string;
      }
    | undefined;
  onWebviewMessage?: (raw: unknown, panel: WebviewPanelLike) => Promise<void>;
}

// Re-export seam types so callers can import them without reaching into internals.
export type { StorageServices as StorageServicesLike };
export type { WebviewPanelLike };
export type { ChatApiLike };

export interface RuntimeDependencies {
  createStorageServices?: (rootDirectory: string) => StorageServices;
  storageRoot?: string;
  windowApi?: WindowApiLike;
  chatApi?: ChatApiLike;
  modelGateway?: ModelGateway;
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

  const modelGateway = dependencies.modelGateway ?? new NoOpModelGateway();

  // Track active orchestration abort controllers by runId
  const activeRuns = new Map<string, AbortController>();

  const orchestrationContext: BridgeOrchestrationContext = {
    modelGateway,
    startOrchestration: async ({ runId, planId, panel: runPanel, signal }) => {
      const controller = new AbortController();
      activeRuns.set(runId, controller);

      // Connect external signal if provided
      if (signal) {
        signal.addEventListener("abort", () => controller.abort(), {
          once: true
        });
      }

      try {
        // Placeholder: actual orchestration loop integration will use
        // OrchestrationLoop + services to load milestones and run phases.
        // For now, we just acknowledge the intent.
        void planId;
        void runPanel;
      } finally {
        activeRuns.delete(runId);
      }
    },
    cancelOrchestration: (runId: string) => {
      const controller = activeRuns.get(runId);
      if (controller) {
        controller.abort();
        activeRuns.delete(runId);
      }
    }
  };

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
      await handleWebviewMessage(
        parsed.data,
        services,
        panel,
        orchestrationContext
      );
    } catch (error) {
      console.error("Failed to handle webview message:", error);
    }
  };

  // Register the webview view provider when extensionUri and windowApi are
  // available (i.e. running inside VS Code, not in tests without them).
  if (context.extensionUri && dependencies.windowApi) {
    const onMessage = async (
      raw: unknown,
      postTarget: WebviewPostTarget
    ): Promise<void> => {
      await context.onWebviewMessage!(raw, postTarget);
    };

    const provider = new AttractorViewProvider({
      extensionUri: context.extensionUri,
      webviewBundlePath: [...ATTRACTOR_WEBVIEW_BUNDLE_PATH],
      onMessage
    });

    const providerDisposable =
      dependencies.windowApi.registerWebviewViewProvider(
        AttractorViewProvider.viewType,
        provider
      );
    context.subscriptions.push(providerDisposable);
  }

  // Register the chat participant when chatApi is available.
  if (dependencies.chatApi) {
    const participant = registerChatParticipant(dependencies.chatApi);
    context.subscriptions.push(participant);
  }
};
