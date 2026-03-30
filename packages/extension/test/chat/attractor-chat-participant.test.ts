import { describe, expect, it, vi } from "vitest";

import {
  buildChatHandler,
  PARTICIPANT_ID,
  registerChatParticipant,
  type ChatApiLike,
  type ChatContextLike,
  type ChatHandlerDependencies,
  type ChatRequestLike,
  type ChatResponseStreamLike
} from "../../src/chat/attractor-chat-participant";

describe("buildChatHandler", () => {
  const makeMockContext = (): ChatContextLike => ({ history: [] });
  const makeMockStream = (): ChatResponseStreamLike => ({
    markdown: vi.fn()
  });

  const makeNullDependencies = (): ChatHandlerDependencies => ({
    services: null,
    orchestration: null,
    outputChannel: null
  });

  it("handles /plan command with acknowledgment", async () => {
    const mockStream = makeMockStream();
    const mockServices = {
      planRegistry: {
        list: vi.fn().mockResolvedValue([])
      },
      milestoneRegistry: {
        listByPlanId: vi.fn()
      }
    };
    const dependencies: ChatHandlerDependencies = {
      services: mockServices as any,
      orchestration: null,
      outputChannel: null
    };

    const handler = buildChatHandler(dependencies);
    const request: ChatRequestLike = { command: "plan", prompt: "test" };

    const result = await handler(
      request,
      makeMockContext(),
      mockStream,
      undefined
    );

    expect(mockStream.markdown).toHaveBeenCalledWith(
      "No plans found. Use the Attractor dashboard to create a plan."
    );
    expect(result).toEqual({});
  });

  it("handles /run command with acknowledgment", async () => {
    const handler = buildChatHandler(makeNullDependencies());
    const request: ChatRequestLike = { command: "run", prompt: "test" };
    const stream = makeMockStream();

    const result = await handler(request, makeMockContext(), stream, undefined);

    expect(stream.markdown).toHaveBeenCalledWith(
      "Run start acknowledged. ...placeholder..."
    );
    expect(result).toEqual({});
  });

  it("handles /status command with status response", async () => {
    const handler = buildChatHandler(makeNullDependencies());
    const request: ChatRequestLike = { command: "status", prompt: "test" };
    const stream = makeMockStream();

    const result = await handler(request, makeMockContext(), stream, undefined);

    expect(stream.markdown).toHaveBeenCalledWith(
      "No active orchestration run."
    );
    expect(result).toEqual({});
  });

  it("handles unknown command with help text", async () => {
    const handler = buildChatHandler(makeNullDependencies());
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
    const handler = buildChatHandler(makeNullDependencies());
    const request: ChatRequestLike = { prompt: "test" };
    const stream = makeMockStream();

    const result = await handler(request, makeMockContext(), stream, undefined);

    expect(stream.markdown).toHaveBeenCalledWith(
      "Available commands: /plan, /run, /status"
    );
    expect(result).toEqual({});
  });

  it("handles /plan command with null services - storage not initialized", async () => {
    const handler = buildChatHandler(makeNullDependencies());
    const request: ChatRequestLike = { command: "plan", prompt: "test" };
    const stream = makeMockStream();

    const result = await handler(request, makeMockContext(), stream, undefined);

    expect(stream.markdown).toHaveBeenCalledWith(
      "Attractor storage not initialized."
    );
    expect(result).toEqual({});
  });

  it("handles /plan command with empty plan list", async () => {
    const mockStream = makeMockStream();
    const mockServices = {
      planRegistry: {
        list: vi.fn().mockResolvedValue([])
      },
      milestoneRegistry: {
        listByPlanId: vi.fn()
      }
    };
    const dependencies: ChatHandlerDependencies = {
      services: mockServices as any,
      orchestration: null,
      outputChannel: null
    };

    const handler = buildChatHandler(dependencies);
    const request: ChatRequestLike = { command: "plan", prompt: "test" };

    const result = await handler(
      request,
      makeMockContext(),
      mockStream,
      undefined
    );

    expect(mockStream.markdown).toHaveBeenCalledWith(
      "No plans found. Use the Attractor dashboard to create a plan."
    );
    expect(result).toEqual({});
  });

  it("handles /plan command with 2 plans - formats as markdown list", async () => {
    const mockStream = makeMockStream();
    const mockServices = {
      planRegistry: {
        list: vi.fn().mockResolvedValue([
          {
            id: "plan-1",
            title: "Ship Orchestration Pipeline",
            goal: "Wire the 3 placeholder gaps in the Attractor VS Code extension so orchestration runs end to end",
            status: "ready",
            repositories: []
          },
          {
            id: "plan-2",
            title: "Improve Dashboard UX",
            goal: "Redesign the dashboard with improved navigation and better milestone visualization",
            status: "draft",
            repositories: []
          }
        ])
      },
      milestoneRegistry: {
        listByPlanId: vi
          .fn()
          .mockResolvedValueOnce([
            { id: "m1" },
            { id: "m2" },
            { id: "m3" },
            { id: "m4" },
            { id: "m5" },
            { id: "m6" },
            { id: "m7" }
          ])
          .mockResolvedValueOnce([
            { id: "m1" },
            { id: "m2" },
            { id: "m3" },
            { id: "m4" }
          ])
      }
    };
    const dependencies: ChatHandlerDependencies = {
      services: mockServices as any,
      orchestration: null,
      outputChannel: null
    };

    const handler = buildChatHandler(dependencies);
    const request: ChatRequestLike = { command: "plan", prompt: "test" };

    const result = await handler(
      request,
      makeMockContext(),
      mockStream,
      undefined
    );

    // Get the markdown argument passed to stream.markdown()
    expect(mockStream.markdown).toHaveBeenCalled();
    const callArg = (mockStream.markdown as any).mock.calls[0][0] as string;

    // Verify the markdown output contains all expected elements
    expect(callArg).toContain("Ship Orchestration Pipeline");
    expect(callArg).toContain("- Status: ready");
    expect(callArg).toContain("- Milestones: 7");
    expect(callArg).toContain("Improve Dashboard UX");
    expect(callArg).toContain("- Status: draft");
    expect(callArg).toContain("- Milestones: 4");
    // Check that goal is truncated (80 chars + "...")
    expect(callArg).toContain(
      "Wire the 3 placeholder gaps in the Attractor VS Code extension so orchestration ..."
    );
    expect(result).toEqual({});
  });
});

describe("registerChatParticipant", () => {
  const makeNullDependencies = (): ChatHandlerDependencies => ({
    services: null,
    orchestration: null,
    outputChannel: null
  });

  it("calls createChatParticipant with correct participant ID", () => {
    const mockParticipant = { dispose: vi.fn() };
    const chatApi: ChatApiLike = {
      createChatParticipant: vi.fn(() => mockParticipant)
    };

    const result = registerChatParticipant(chatApi, makeNullDependencies());

    expect(chatApi.createChatParticipant).toHaveBeenCalledWith(
      PARTICIPANT_ID,
      expect.any(Function)
    );
    expect(result).toBe(mockParticipant);
  });
});
