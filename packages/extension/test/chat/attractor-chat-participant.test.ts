import { describe, expect, it, vi } from "vitest";

import {
  buildChatHandler,
  PARTICIPANT_ID,
  registerChatParticipant,
  type ChatApiLike,
  type ChatContextLike,
  type ChatRequestLike,
  type ChatResponseStreamLike
} from "../../src/chat/attractor-chat-participant";

describe("buildChatHandler", () => {
  const makeMockContext = (): ChatContextLike => ({ history: [] });
  const makeMockStream = (): ChatResponseStreamLike => ({
    markdown: vi.fn()
  });

  it("handles /plan command with acknowledgment", async () => {
    const handler = buildChatHandler();
    const request: ChatRequestLike = { command: "plan", prompt: "test" };
    const stream = makeMockStream();

    const result = await handler(request, makeMockContext(), stream, undefined);

    expect(stream.markdown).toHaveBeenCalledWith(
      "Plan creation acknowledged. ...placeholder..."
    );
    expect(result).toEqual({});
  });

  it("handles /run command with acknowledgment", async () => {
    const handler = buildChatHandler();
    const request: ChatRequestLike = { command: "run", prompt: "test" };
    const stream = makeMockStream();

    const result = await handler(request, makeMockContext(), stream, undefined);

    expect(stream.markdown).toHaveBeenCalledWith(
      "Run start acknowledged. ...placeholder..."
    );
    expect(result).toEqual({});
  });

  it("handles /status command with status response", async () => {
    const handler = buildChatHandler();
    const request: ChatRequestLike = { command: "status", prompt: "test" };
    const stream = makeMockStream();

    const result = await handler(request, makeMockContext(), stream, undefined);

    expect(stream.markdown).toHaveBeenCalledWith(
      "No active orchestration run."
    );
    expect(result).toEqual({});
  });

  it("handles unknown command with help text", async () => {
    const handler = buildChatHandler();
    const request: ChatRequestLike = {
      command: "unknown",
      prompt: "test"
    };
    const stream = makeMockStream();

    const result = await handler(request, makeMockContext(), stream, undefined);

    expect(stream.markdown).toHaveBeenCalledWith(
      "Available commands: /plan, /run, /status"
    );
    expect(result).toEqual({});
  });

  it("handles missing command with help text", async () => {
    const handler = buildChatHandler();
    const request: ChatRequestLike = { prompt: "test" };
    const stream = makeMockStream();

    const result = await handler(request, makeMockContext(), stream, undefined);

    expect(stream.markdown).toHaveBeenCalledWith(
      "Available commands: /plan, /run, /status"
    );
    expect(result).toEqual({});
  });
});

describe("registerChatParticipant", () => {
  it("calls createChatParticipant with correct participant ID", () => {
    const mockParticipant = { dispose: vi.fn() };
    const chatApi: ChatApiLike = {
      createChatParticipant: vi.fn(() => mockParticipant)
    };

    const result = registerChatParticipant(chatApi);

    expect(chatApi.createChatParticipant).toHaveBeenCalledWith(
      PARTICIPANT_ID,
      expect.any(Function)
    );
    expect(result).toBe(mockParticipant);
  });
});
