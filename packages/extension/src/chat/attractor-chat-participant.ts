/**
 * Chat participant registration and command parsing for Attractor.
 * Provides /plan, /run, /status slash commands.
 */

import type { StorageServices } from "../storage/services";

export interface OutputChannelLike {
  appendLine(value: string): void;
}

export interface ChatHandlerDependencies {
  services: StorageServices | null;
  orchestration: {
    startOrchestration: (options: {
      runId: string;
      planId: string;
      panel: any; // WebviewPanelLike, but avoiding circular import
      signal?: AbortSignal;
    }) => Promise<void>;
    cancelOrchestration: (runId: string) => void;
  } | null;
  outputChannel: OutputChannelLike | null;
}

export interface ChatResponseStreamLike {
  markdown(value: string): void;
}

export interface ChatRequestLike {
  command?: string;
  prompt: string;
}

export interface ChatContextLike {
  history: unknown[];
}

export interface ChatResultLike {
  metadata?: Record<string, unknown>;
}

export interface CancellationTokenLike {
  onCancellationRequested(listener: () => void): void;
}

export type ChatRequestHandler = (
  request: ChatRequestLike,
  context: ChatContextLike,
  stream: ChatResponseStreamLike,
  token: CancellationTokenLike
) => Promise<ChatResultLike>;

export interface ChatParticipantLike {
  dispose(): void;
}

export interface ChatApiLike {
  createChatParticipant(
    participantId: string,
    handler: ChatRequestHandler
  ): ChatParticipantLike;
}

export const PARTICIPANT_ID = "attractor.attractor";

/**
 * Build the chat request handler that dispatches on slash commands.
 */
export const buildChatHandler = (
  options: ChatHandlerDependencies
): ChatRequestHandler => {
  return async (request, context, stream, token): Promise<ChatResultLike> => {
    // Suppress unused parameter warnings
    void context;

    switch (request.command) {
      case "plan": {
        const { services } = options;

        if (!services) {
          stream.markdown("Attractor storage not initialized.");
          return {};
        }

        const plans = await services.planRegistry.list();

        if (plans.length === 0) {
          stream.markdown(
            "No plans found. Use the Attractor dashboard to create a plan."
          );
          return {};
        }

        // Format plans as markdown list
        const planLines = await Promise.all(
          plans.map(async (plan) => {
            const truncatedGoal =
              plan.goal.length > 80
                ? `${plan.goal.slice(0, 80)}...`
                : plan.goal;
            const milestones = await services.milestoneRegistry.listByPlanId(
              plan.id
            );
            const milestoneCount = milestones.length;

            return (
              `### ${plan.title}\n` +
              `- Status: ${plan.status}\n` +
              `- Goal: ${truncatedGoal}\n` +
              `- Milestones: ${milestoneCount}`
            );
          })
        );

        stream.markdown(planLines.join("\n\n"));
        return {};
      }

      case "run": {
        const { services, orchestration } = options;

        // Check orchestration availability first
        if (!orchestration) {
          stream.markdown("Orchestration not available.");
          return {};
        }

        // Parse plan ID from prompt
        const planId = request.prompt.trim();

        // If no plan ID, list available plans
        if (!planId) {
          if (!services) {
            stream.markdown(
              "Please specify a plan ID: `/run <plan-id>`. Attractor storage not initialized."
            );
            return {};
          }

          const plans = await services.planRegistry.list();
          if (plans.length === 0) {
            stream.markdown(
              "Please specify a plan ID: `/run <plan-id>`. No plans found."
            );
            return {};
          }

          const planList = plans.map((p) => `- ${p.id}: ${p.title}`).join("\n");
          stream.markdown(
            `Please specify a plan ID: \`/run <plan-id>\`. Available plans:\n\n${planList}`
          );
          return {};
        }

        // Generate run ID
        const runId = crypto.randomUUID();

        // Convert CancellationToken to AbortSignal
        const abortController = new AbortController();
        token.onCancellationRequested(() => abortController.abort());
        const signal = abortController.signal;

        // Start orchestration (fire and forget)
        void orchestration.startOrchestration({
          runId,
          planId,
          panel: null,
          signal
        });

        stream.markdown(
          `Starting orchestration run \`${runId}\` for plan \`${planId}\`...`
        );

        return {};
      }

      case "status": {
        const { services } = options;

        if (!services) {
          stream.markdown("Attractor storage not initialized.");
          return {};
        }

        const activeRuns = await services.runRegistry.listActiveRuns();

        if (activeRuns.length === 0) {
          stream.markdown("No active orchestration runs.");
          return {};
        }

        // Format runs as markdown list
        const runLines = activeRuns.map(
          (run) =>
            `### Run ${run.id}\n` +
            `- Plan: ${run.planId}\n` +
            `- Status: ${run.status}\n` +
            `- Started: ${run.startedAt || "N/A"}`
        );

        stream.markdown(runLines.join("\n\n"));
        return {};
      }

      default:
        stream.markdown("Available commands: /plan, /run, /status");
        return {};
    }
  };
};

/**
 * Register the Attractor chat participant with the VS Code chat API.
 */
export const registerChatParticipant = (
  chatApi: ChatApiLike,
  dependencies: ChatHandlerDependencies
): ChatParticipantLike => {
  return chatApi.createChatParticipant(
    PARTICIPANT_ID,
    buildChatHandler(dependencies)
  );
};
