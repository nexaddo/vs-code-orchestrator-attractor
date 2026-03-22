/**
 * Represents a message sent to or received from a language model.
 */
export interface ModelMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Options for configuring a model request.
 */
export interface ModelRequestOptions {
  modelFamily?: string;
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}

/**
 * Abstract gateway for language model interactions.
 * Implementations may target VS Code Copilot, OpenAI, or test stubs.
 */
export interface ModelGateway {
  send(
    messages: ModelMessage[],
    options?: ModelRequestOptions
  ): Promise<string>;

  stream(
    messages: ModelMessage[],
    onChunk: (text: string) => void,
    options?: ModelRequestOptions
  ): Promise<void>;
}

/**
 * A no-op gateway that returns empty responses.
 * Used as the default when no real model provider is configured.
 */
export class NoOpModelGateway implements ModelGateway {
  async send(
    messages: ModelMessage[],
    options?: ModelRequestOptions
  ): Promise<string> {
    void messages;
    void options;
    return "";
  }

  async stream(
    messages: ModelMessage[],
    onChunk: (text: string) => void,
    options?: ModelRequestOptions
  ): Promise<void> {
    void messages;
    void onChunk;
    void options;
    return;
  }
}
