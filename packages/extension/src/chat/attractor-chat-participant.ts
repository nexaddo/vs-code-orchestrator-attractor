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

export type ChatRequestHandler = (
  request: ChatRequestLike,
  context: ChatContextLike,
  stream: ChatResponseStreamLike,
  token: unknown
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
  // Suppress unused parameter warnings
  void options;

  return async (request, context, stream, token): Promise<ChatResultLike> => {
    // Suppress unused parameter warnings
    void context;
    void token;

    switch (request.command) {
      case "plan":
        stream.markdown("Plan creation acknowledged. ...placeholder...");
        return {};

      case "run":
        stream.markdown("Run start acknowledged. ...placeholder...");
        return {};

      case "status":
        stream.markdown("No active orchestration run.");
        return {};

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
