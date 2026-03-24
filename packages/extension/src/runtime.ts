import {
  CONTRACT_VERSION,
  WebviewInboundMessageSchema
} from "@attractor/shared";

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
  "dist",
  "bundle",
  "webview"
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
  outputChannel?: { appendLine(value: string): void };
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
  const log = dependencies.outputChannel ?? { appendLine: () => {} };
  log.appendLine("Attractor: activating…");

  // --- Storage init (error-bounded) ---
  const storageRoot = dependencies.storageRoot ?? getStorageRoot(context);
  let services: StorageServices | null = null;

  if (storageRoot) {
    log.appendLine(`Attractor: storage root resolved → ${storageRoot}`);
    try {
      const buildStorageServices =
        dependencies.createStorageServices ??
        ((rootDirectory: string): StorageServices =>
          createStorageServices(rootDirectory));
      services = buildStorageServices(storageRoot);
      log.appendLine("Attractor: storage services created");
    } catch (err) {
      log.appendLine(
        `Attractor: storage services failed — ${err instanceof Error ? err.message : String(err)}`
      );
    }
  } else {
    log.appendLine("Attractor: no storage root available");
  }

  // --- Commands (always register) ---
  const disposables = registerAttractorCommands(commandsApi);
  context.subscriptions.push(...disposables);

  const modelGateway = dependencies.modelGateway ?? new NoOpModelGateway();
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
        // Placeholder per M4 plan — actual OrchestrationLoop integration
        // deferred to M4.5/M5. Will use OrchestrationLoop + services to
        // load milestones, build MilestoneInput[], and run phases.
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

  // --- Webview message handler (with degraded-state support) ---
  context.onWebviewMessage = async (
    raw: unknown,
    panel: WebviewPanelLike
  ): Promise<void> => {
    if (!services) {
      // Degraded mode: respond to "ready" with empty overview + error
      const parsed = WebviewInboundMessageSchema.safeParse(raw);
      if (parsed.success && parsed.data.type === "ready") {
        panel.postMessage({
          version: CONTRACT_VERSION,
          requestId: parsed.data.requestId,
          type: "overview.state",
          payload: {
            repositories: [],
            activeRuns: [],
            recentFailures: [],
            stats: {
              totalRepos: 0,
              totalPlans: 0,
              activeRuns: 0,
              pausedRuns: 0,
              failedRuns24h: 0
            },
            error:
              "Storage unavailable — extension storage failed to initialize"
          }
        });
      }
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
      log.appendLine(
        `Attractor: failed to handle webview message — ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`
      );
    }
  };

  // --- Provider registration (error-bounded) ---
  if (context.extensionUri && dependencies.windowApi) {
    try {
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
      log.appendLine("Attractor: webview provider registered");
    } catch (err) {
      log.appendLine(
        `Attractor: provider registration failed — ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // --- Chat participant registration (error-bounded) ---
  if (dependencies.chatApi) {
    try {
      const participant = registerChatParticipant(dependencies.chatApi);
      context.subscriptions.push(participant);
      log.appendLine("Attractor: chat participant registered");
    } catch (err) {
      log.appendLine(
        `Attractor: chat registration failed — ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  log.appendLine("Attractor: activation complete");
};
