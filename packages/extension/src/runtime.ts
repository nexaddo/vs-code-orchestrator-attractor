import {
  CONTRACT_VERSION,
  type ExtensionEvent,
  WebviewInboundMessageSchema
} from "@attractor/shared";

import {
  createStorageServices,
  getStorageRoot,
  type StorageServices
} from "./storage/services";
import { NoOpModelGateway, type ModelGateway } from "./application/ports";
import {
  OrchestrationLoop,
  nextRoleAfter,
  type MilestoneInput,
  type Role
} from "./application/orchestration-loop";
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
  type ChatApiLike,
  type ChatHandlerDependencies
} from "./chat/attractor-chat-participant";

export const ATTRACTOR_HELLO_COMMAND = "attractor.hello";
export const ATTRACTOR_DASHBOARD_OPEN_COMMAND = "attractor.openDashboard";
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
  commandsApi: CommandsApiLike,
  getViewProvider?: () => AttractorViewProvider | undefined
): DisposableLike[] => {
  return [
    commandsApi.registerCommand(ATTRACTOR_HELLO_COMMAND, () => {
      return;
    }),
    commandsApi.registerCommand(ATTRACTOR_DASHBOARD_OPEN_COMMAND, () => {
      getViewProvider?.()?.revealView();
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

  let viewProvider: AttractorViewProvider | undefined;

  // --- Commands (always register) ---
  const disposables = registerAttractorCommands(
    commandsApi,
    () => viewProvider
  );
  context.subscriptions.push(...disposables);

  const modelGateway = dependencies.modelGateway ?? new NoOpModelGateway();
  const activeRuns = new Map<string, AbortController>();

  const orchestrationContext: BridgeOrchestrationContext = {
    modelGateway,
    startOrchestration: async ({ runId, planId, panel: runPanel, signal }) => {
      const controller = new AbortController();
      activeRuns.set(runId, controller);
      const startTime = Date.now();

      log.appendLine(
        `Attractor: orchestration started — run=${runId} plan=${planId}`
      );

      // Connect external signal if provided
      if (signal) {
        signal.addEventListener("abort", () => controller.abort(), {
          once: true
        });
      }

      const panel = (runPanel ?? null) as WebviewPanelLike | null;
      const postRunMessage = (type: string, payload: unknown): void => {
        if (!panel) {
          return;
        }
        void panel.postMessage({
          version: 1,
          type,
          payload
        });
      };

      if (!services) {
        const message =
          "Attractor: orchestration start failed — storage services unavailable";
        log.appendLine(message);
        postRunMessage("run.error", {
          runId,
          milestoneId: null,
          role: "orchestrator",
          message
        });
        activeRuns.delete(runId);
        return;
      }

      const now = new Date().toISOString();
      const runningRecord = {
        version: CONTRACT_VERSION,
        id: runId,
        planId,
        status: "running" as const,
        attempt: 1,
        createdAt: now,
        updatedAt: now,
        startedAt: now
      };
      let runRecordSaved = false;
      let observedLoopError = false;

      try {
        await services.runRegistry.save(runningRecord);
        runRecordSaved = true;

        const plan = await services.planRegistry.getById(planId);
        if (!plan) {
          throw new Error(`Plan not found: ${planId}`);
        }

        const milestoneRecords =
          await services.milestoneRegistry.listByPlanId(planId);
        if (milestoneRecords.length === 0) {
          throw new Error(`No milestones found for plan: ${planId}`);
        }

        log.appendLine(
          `Attractor: plan loaded — ${plan.title} (${milestoneRecords.length} milestones)`
        );

        const milestones: MilestoneInput[] = milestoneRecords
          .map((record) => ({
            id: record.id,
            // MilestoneRecord has no description field; use title for both
            // MilestoneInput.name and MilestoneInput.description.
            name: record.title,
            order: record.order,
            description: record.title,
            acceptanceCriteria: record.acceptanceCriteria
          }))
          .sort((left, right) => left.order - right.order);

        let previousMilestoneIndex = -1;
        const previousPhaseStatus = new Map<string, string>();
        const loop = new OrchestrationLoop();
        await loop.execute({
          modelGateway: orchestrationContext.modelGateway,
          milestones,
          runId,
          planTitle: plan.title,
          planGoal: plan.goal,
          onStateChange: (state) => {
            if (state.milestoneIndex !== previousMilestoneIndex) {
              previousMilestoneIndex = state.milestoneIndex;
              log.appendLine(
                `Attractor: milestone ${state.milestoneIndex + 1}/${state.milestoneCount} — ${state.milestoneName}`
              );
            }
            for (const phase of state.phases) {
              const prev = previousPhaseStatus.get(phase.role);
              if (phase.status === "running" && prev !== "running") {
                log.appendLine(
                  `Attractor: phase ${phase.role} — milestone ${state.milestoneName}`
                );
              }
              previousPhaseStatus.set(phase.role, phase.status);
            }
            postRunMessage("run.state", state);
          },
          onHandoff: (handoff, role: Role) => {
            const toRole = nextRoleAfter(role);
            const reason =
              "description" in handoff &&
              typeof handoff.description === "string"
                ? handoff.description
                : "summary" in handoff && typeof handoff.summary === "string"
                  ? handoff.summary
                  : "comments" in handoff &&
                      Array.isArray(handoff.comments) &&
                      handoff.comments.length > 0
                    ? handoff.comments[0]
                    : "tasks" in handoff && Array.isArray(handoff.tasks)
                      ? `${handoff.tasks.length} tasks planned`
                      : "handoff";
            log.appendLine(
              `Attractor: handoff ${role} → ${toRole} — ${reason}`
            );

            const event: ExtensionEvent = {
              version: CONTRACT_VERSION,
              id: `${runId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
              runId,
              entityType: "handoff",
              entityId:
                "milestoneId" in handoff &&
                typeof handoff.milestoneId === "string"
                  ? handoff.milestoneId
                  : runId,
              kind: "handoff.created",
              timestamp: new Date().toISOString(),
              payload: {
                role,
                handoff
              }
            };

            void services.eventLog.append(event).catch((error: unknown) => {
              log.appendLine(
                `Attractor: failed to append handoff event — ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`
              );
            });

            postRunMessage("run.handoff", {
              role,
              handoff
            });
          },
          onError: (error, milestoneId, role) => {
            observedLoopError = true;
            log.appendLine(
              `Attractor: error in ${role} at milestone ${milestoneId} — ${error.message}`
            );
            postRunMessage("run.error", {
              runId,
              milestoneId,
              role,
              message: error.message
            });
          },
          signal: controller.signal
        });

        if (runRecordSaved) {
          const duration = Date.now() - startTime;
          const completedAt = new Date().toISOString();
          await services.runRegistry.save({
            ...runningRecord,
            status: observedLoopError ? "failed" : "completed",
            updatedAt: completedAt,
            completedAt
          });

          if (observedLoopError) {
            log.appendLine(
              `Attractor: orchestration failed — run=${runId} duration=${duration}ms`
            );
          } else {
            log.appendLine(
              `Attractor: orchestration completed — run=${runId} duration=${duration}ms`
            );
          }
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (
          error instanceof Error &&
          (error.name === "AbortError" ||
            (error.message && error.message.includes("abort")))
        ) {
          log.appendLine(
            `Attractor: orchestration canceled — run=${runId} duration=${duration}ms`
          );
        } else {
          log.appendLine(
            `Attractor: orchestration failed — run=${runId} error=${errorMessage} duration=${duration}ms`
          );
        }
        if (runRecordSaved) {
          const completedAt = new Date().toISOString();
          await services.runRegistry.save({
            ...runningRecord,
            status: "failed",
            updatedAt: completedAt,
            completedAt
          });
        }

        postRunMessage("run.error", {
          runId,
          milestoneId: null,
          role: "orchestrator",
          message: error instanceof Error ? error.message : String(error)
        });
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

      viewProvider = provider;

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
      const chatDependencies: ChatHandlerDependencies = {
        services,
        orchestration: orchestrationContext,
        outputChannel: log
      };
      const participant = registerChatParticipant(
        dependencies.chatApi,
        chatDependencies
      );
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
