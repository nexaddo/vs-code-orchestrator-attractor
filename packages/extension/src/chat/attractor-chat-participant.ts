/**
 * Chat participant registration and command parsing for Attractor.
 * Provides /plan, /run, /status slash commands.
 */

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
export const buildChatHandler = (): ChatRequestHandler => {
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
  chatApi: ChatApiLike
): ChatParticipantLike => {
  return chatApi.createChatParticipant(PARTICIPANT_ID, buildChatHandler());
};
