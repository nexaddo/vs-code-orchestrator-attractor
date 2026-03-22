import { describe, it, expect, vi } from "vitest";
import {
  CopilotModelGateway,
  type LanguageModelApiLike,
  type ChatModelLike,
  type LanguageModelChatResponseLike
} from "../../src/copilot/copilot-model-gateway.js";
import type { ModelMessage } from "../../src/application/ports.js";

/**
 * Creates a mock LanguageModelApiLike for testing.
 */
function createMockApi(
  responseChunks: string[],
  modelAvailable = true
): LanguageModelApiLike {
  const mockResponse: LanguageModelChatResponseLike = {
    text: (async function* () {
      for (const chunk of responseChunks) {
        yield chunk;
      }
    })()
  };

  const mockModel: ChatModelLike = {
    sendRequest: vi.fn().mockResolvedValue(mockResponse)
  };

  return {
    selectChatModels: vi
      .fn()
      .mockResolvedValue(modelAvailable ? [mockModel] : []),
    createChatMessage: vi
      .fn()
      .mockImplementation((role: number, content: string) => ({
        role,
        content
      }))
  };
}

describe("CopilotModelGateway", () => {
  it("send() returns concatenated text from streamed fragments", async () => {
    const api = createMockApi(["Hello", " ", "world", "!"]);
    const gateway = new CopilotModelGateway(api);

    const messages: ModelMessage[] = [{ role: "user", content: "Say hello" }];

    const result = await gateway.send(messages);

    expect(result).toBe("Hello world!");
  });

  it("stream() calls onChunk for each fragment", async () => {
    const api = createMockApi(["chunk1", "chunk2", "chunk3"]);
    const gateway = new CopilotModelGateway(api);

    const messages: ModelMessage[] = [
      { role: "user", content: "Generate text" }
    ];

    const chunks: string[] = [];
    const onChunk = vi.fn((chunk: string) => chunks.push(chunk));

    await gateway.stream(messages, onChunk);

    expect(onChunk).toHaveBeenCalledTimes(3);
    expect(chunks).toEqual(["chunk1", "chunk2", "chunk3"]);
  });

  it("throws descriptive error when no model is found", async () => {
    const api = createMockApi([], false);
    const gateway = new CopilotModelGateway(api, "gpt-4o");

    const messages: ModelMessage[] = [{ role: "user", content: "Test" }];

    await expect(gateway.send(messages)).rejects.toThrow(
      "No Copilot model available for family: gpt-4o"
    );
  });

  it("propagates errors from model request failure", async () => {
    const mockModel: ChatModelLike = {
      sendRequest: vi.fn().mockRejectedValue(new Error("Network error"))
    };

    const api: LanguageModelApiLike = {
      selectChatModels: vi.fn().mockResolvedValue([mockModel]),
      createChatMessage: vi
        .fn()
        .mockImplementation((role: number, content: string) => ({
          role,
          content
        }))
    };

    const gateway = new CopilotModelGateway(api);
    const messages: ModelMessage[] = [{ role: "user", content: "Test" }];

    await expect(gateway.send(messages)).rejects.toThrow("Network error");
  });

  it("maps multiple messages correctly to API format", async () => {
    const api = createMockApi(["response"]);
    const gateway = new CopilotModelGateway(api);

    const messages: ModelMessage[] = [
      { role: "system", content: "You are helpful" },
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there" },
      { role: "user", content: "How are you?" }
    ];

    await gateway.send(messages);

    // Verify createChatMessage was called with correct role mappings
    expect(api.createChatMessage).toHaveBeenCalledWith(
      1,
      "You are helpful\n\nHello"
    ); // System prepended to first user
    expect(api.createChatMessage).toHaveBeenCalledWith(2, "Hi there"); // Assistant
    expect(api.createChatMessage).toHaveBeenCalledWith(1, "How are you?"); // User
  });

  it("uses custom model family from options", async () => {
    const api = createMockApi(["test"]);
    const gateway = new CopilotModelGateway(api, "gpt-4o");

    const messages: ModelMessage[] = [{ role: "user", content: "Test" }];

    await gateway.send(messages, { modelFamily: "gpt-4-turbo" });

    expect(api.selectChatModels).toHaveBeenCalledWith({
      vendor: "copilot",
      family: "gpt-4-turbo"
    });
  });

  it("handles empty message list", async () => {
    const api = createMockApi(["response"]);
    const gateway = new CopilotModelGateway(api);

    const result = await gateway.send([]);

    expect(result).toBe("response");
  });

  it("handles system-only messages by prepending to next user message", async () => {
    const api = createMockApi(["response"]);
    const gateway = new CopilotModelGateway(api);

    const messages: ModelMessage[] = [
      { role: "system", content: "System instruction 1" },
      { role: "system", content: "System instruction 2" },
      { role: "user", content: "User query" }
    ];

    await gateway.send(messages);

    expect(api.createChatMessage).toHaveBeenCalledWith(
      1,
      "System instruction 1\n\nSystem instruction 2\n\nUser query"
    );
  });
});
