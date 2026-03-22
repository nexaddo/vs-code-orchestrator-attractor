import type {
  ModelGateway,
  ModelMessage,
  ModelRequestOptions
} from "../application/ports.js";

/**
 * Promise-like type matching VS Code's Thenable.
 */
type Thenable<T> = PromiseLike<T>;

/**
 * Seam interface for VS Code Language Model API.
 * Allows testing without actual vscode dependencies.
 */
export interface LanguageModelChatMessageLike {
  role: number; // vscode.LanguageModelChatMessageRole enum values
  content: string;
}

export interface LanguageModelChatResponseLike {
  text: AsyncIterable<string>;
}

export interface ChatModelLike {
  sendRequest(
    messages: LanguageModelChatMessageLike[],
    options?: unknown,
    token?: unknown
  ): Thenable<LanguageModelChatResponseLike>;
}

export interface LanguageModelApiLike {
  selectChatModels(selector: {
    vendor?: string;
    family?: string;
  }): Thenable<ChatModelLike[]>;
  createChatMessage(
    role: number,
    content: string
  ): LanguageModelChatMessageLike;
}

/**
 * Role mapping from ModelMessage roles to VS Code LanguageModelChatMessageRole enum values.
 * VS Code uses: User=1, Assistant=2
 * System messages are prepended to first user message as there's no System role in the API.
 */
const ROLE_MAP: Record<ModelMessage["role"], number> = {
  system: 1, // Will be handled specially (prepended to first user message)
  user: 1,
  assistant: 2
};

/**
 * ModelGateway implementation using VS Code's Copilot Language Model API.
 * Provides access to GitHub Copilot models via vscode.lm API.
 */
export class CopilotModelGateway implements ModelGateway {
  constructor(
    private readonly api: LanguageModelApiLike,
    private readonly defaultModelFamily: string = "gpt-4o"
  ) {}

  async send(
    messages: ModelMessage[],
    options?: ModelRequestOptions
  ): Promise<string> {
    const chunks: string[] = [];
    await this.stream(messages, (chunk) => chunks.push(chunk), options);
    return chunks.join("");
  }

  async stream(
    messages: ModelMessage[],
    onChunk: (text: string) => void,
    options?: ModelRequestOptions
  ): Promise<void> {
    const modelFamily = options?.modelFamily ?? this.defaultModelFamily;

    // Select the Copilot model
    const models = await this.api.selectChatModels({
      vendor: "copilot",
      family: modelFamily
    });

    if (models.length === 0) {
      throw new Error(`No Copilot model available for family: ${modelFamily}`);
    }

    const model = models[0];
    if (!model) {
      throw new Error(`No Copilot model available for family: ${modelFamily}`);
    }

    // Convert messages to VS Code format
    const apiMessages = this.convertMessages(messages);

    // Send request
    const response = await model.sendRequest(apiMessages, options);

    // Stream the response
    for await (const chunk of response.text) {
      onChunk(chunk);
    }
  }

  /**
   * Convert ModelMessage[] to LanguageModelChatMessageLike[].
   * System messages are prepended to the first user message since VS Code LM API lacks a system role.
   */
  private convertMessages(
    messages: ModelMessage[]
  ): LanguageModelChatMessageLike[] {
    const result: LanguageModelChatMessageLike[] = [];
    let systemPrefix = "";

    for (const msg of messages) {
      if (msg.role === "system") {
        // Accumulate system messages
        systemPrefix += msg.content + "\n\n";
      } else if (msg.role === "user") {
        // Prepend accumulated system messages to first user message
        const content = systemPrefix ? systemPrefix + msg.content : msg.content;
        result.push(this.api.createChatMessage(ROLE_MAP.user, content));
        systemPrefix = ""; // Clear after first use
      } else {
        // Assistant message
        result.push(
          this.api.createChatMessage(ROLE_MAP.assistant, msg.content)
        );
      }
    }

    if (systemPrefix && result.length === 0) {
      const content = systemPrefix.endsWith("\n\n")
        ? systemPrefix.slice(0, -2)
        : systemPrefix;
      result.push(this.api.createChatMessage(ROLE_MAP.user, content));
    }

    return result;
  }
}
