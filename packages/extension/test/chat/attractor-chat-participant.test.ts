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
import type { StorageServices } from "../../src/storage/services";

const makePartialServices = (
  overrides: Partial<StorageServices>
): StorageServices => {
  const stub = {
    repositoryRegistry: {},
    planRegistry: {},
    runRegistry: {},
    eventLog: {},
    snapshotProjector: {},
    milestoneRunRegistry: {},
    milestoneRegistry: {},
    artifactRegistry: {},
    ...overrides
  };
  return stub as unknown as StorageServices;
};

describe("buildChatHandler", () => {
  const makeMockContext = (): ChatContextLike => ({ history: [] });
  const makeMockStream = (): ChatResponseStreamLike => ({
    markdown: vi.fn()
  });
  const makeMockToken = () => ({ onCancellationRequested: vi.fn() });

  const makeNullDependencies = (): ChatHandlerDependencies => ({
    services: null,
    orchestration: null,
    outputChannel: null
  });

  it("handles /plan command with acknowledgment", async () => {
    const mockStream = makeMockStream();
    const dependencies: ChatHandlerDependencies = {
      services: makePartialServices({
        planRegistry: {
          save: vi.fn(),
          getById: vi.fn(),
          list: vi.fn().mockResolvedValue([])
        },
        milestoneRegistry: {
          save: vi.fn(),
          getById: vi.fn(),
          list: vi.fn(),
          listByPlanId: vi.fn()
        }
      }),
      orchestration: null,
      outputChannel: null
    };

    const handler = buildChatHandler(dependencies);
    const request: ChatRequestLike = { command: "plan", prompt: "test" };

    const result = await handler(
      request,
      makeMockContext(),
      mockStream,
      makeMockToken()
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

    const result = await handler(request, makeMockContext(), stream, {
      onCancellationRequested: vi.fn()
    });

    expect(stream.markdown).toHaveBeenCalledWith(
      "Orchestration not available."
    );
    expect(result).toEqual({});
  });

  it("handles /status command with null services", async () => {
    const handler = buildChatHandler(makeNullDependencies());
    const request: ChatRequestLike = { command: "status", prompt: "test" };
    const stream = makeMockStream();

    const result = await handler(
      request,
      makeMockContext(),
      stream,
      makeMockToken()
    );

    expect(stream.markdown).toHaveBeenCalledWith(
      "Attractor storage not initialized."
    );
    expect(result).toEqual({});
  });

  it("handles /status command with no active runs", async () => {
    const mockStream = makeMockStream();
    const dependencies: ChatHandlerDependencies = {
      services: makePartialServices({
        runRegistry: {
          save: vi.fn(),
          getById: vi.fn(),
          list: vi.fn(),
          listActiveRuns: vi.fn().mockResolvedValue([])
        }
      }),
      orchestration: null,
      outputChannel: null
    };

    const handler = buildChatHandler(dependencies);
    const request: ChatRequestLike = { command: "status", prompt: "test" };

    const result = await handler(
      request,
      makeMockContext(),
      mockStream,
      makeMockToken()
    );

    expect(mockStream.markdown).toHaveBeenCalledWith(
      "No active orchestration runs."
    );
    expect(result).toEqual({});
  });

  it("handles /status command with active run", async () => {
    const mockStream = makeMockStream();
    const dependencies: ChatHandlerDependencies = {
      services: makePartialServices({
        runRegistry: {
          save: vi.fn(),
          getById: vi.fn(),
          list: vi.fn(),
          listActiveRuns: vi.fn().mockResolvedValue([
            {
              id: "run-123",
              planId: "plan-456",
              status: "running",
              attempt: 1,
              startedAt: "2024-03-15T10:30:00.000Z",
              createdAt: "2024-03-15T10:30:00.000Z",
              updatedAt: "2024-03-15T10:30:00.000Z"
            }
          ])
        }
      }),
      orchestration: null,
      outputChannel: null
    };

    const handler = buildChatHandler(dependencies);
    const request: ChatRequestLike = { command: "status", prompt: "test" };

    const result = await handler(
      request,
      makeMockContext(),
      mockStream,
      makeMockToken()
    );

    expect(mockStream.markdown).toHaveBeenCalled();
    const callArg = vi.mocked(mockStream.markdown).mock.calls[0]![0] as string;

    expect(callArg).toContain("run-123");
    expect(callArg).toContain("plan-456");
    expect(callArg).toContain("running");
    expect(callArg).toContain("2024-03-15T10:30:00.000Z");
    expect(result).toEqual({});
  });

  it("handles unknown command with help text", async () => {
    const handler = buildChatHandler(makeNullDependencies());
    const request: ChatRequestLike = {
      command: "unknown",
      prompt: "test"
    };
    const stream = makeMockStream();

    const result = await handler(
      request,
      makeMockContext(),
      stream,
      makeMockToken()
    );

    expect(stream.markdown).toHaveBeenCalledWith(
      "Available commands: /plan, /run, /status"
    );
    expect(result).toEqual({});
  });

  it("handles missing command with help text", async () => {
    const handler = buildChatHandler(makeNullDependencies());
    const request: ChatRequestLike = { prompt: "test" };
    const stream = makeMockStream();

    const result = await handler(
      request,
      makeMockContext(),
      stream,
      makeMockToken()
    );

    expect(stream.markdown).toHaveBeenCalledWith(
      "Available commands: /plan, /run, /status"
    );
    expect(result).toEqual({});
  });

  it("handles /plan command with null services - storage not initialized", async () => {
    const handler = buildChatHandler(makeNullDependencies());
    const request: ChatRequestLike = { command: "plan", prompt: "test" };
    const stream = makeMockStream();

    const result = await handler(
      request,
      makeMockContext(),
      stream,
      makeMockToken()
    );

    expect(stream.markdown).toHaveBeenCalledWith(
      "Attractor storage not initialized."
    );
    expect(result).toEqual({});
  });

  it("handles /plan command with empty plan list", async () => {
    const mockStream = makeMockStream();
    const dependencies: ChatHandlerDependencies = {
      services: makePartialServices({
        planRegistry: {
          save: vi.fn(),
          getById: vi.fn(),
          list: vi.fn().mockResolvedValue([])
        },
        milestoneRegistry: {
          save: vi.fn(),
          getById: vi.fn(),
          list: vi.fn(),
          listByPlanId: vi.fn()
        }
      }),
      orchestration: null,
      outputChannel: null
    };

    const handler = buildChatHandler(dependencies);
    const request: ChatRequestLike = { command: "plan", prompt: "test" };

    const result = await handler(
      request,
      makeMockContext(),
      mockStream,
      makeMockToken()
    );

    expect(mockStream.markdown).toHaveBeenCalledWith(
      "No plans found. Use the Attractor dashboard to create a plan."
    );
    expect(result).toEqual({});
  });

  it("handles /plan command with 2 plans - formats as markdown list", async () => {
    const mockStream = makeMockStream();
    const dependencies: ChatHandlerDependencies = {
      services: makePartialServices({
        planRegistry: {
          save: vi.fn(),
          getById: vi.fn(),
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
          save: vi.fn(),
          getById: vi.fn(),
          list: vi.fn(),
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
      }),
      orchestration: null,
      outputChannel: null
    };

    const handler = buildChatHandler(dependencies);
    const request: ChatRequestLike = { command: "plan", prompt: "test" };

    const result = await handler(
      request,
      makeMockContext(),
      mockStream,
      makeMockToken()
    );

    // Get the markdown argument passed to stream.markdown()
    expect(mockStream.markdown).toHaveBeenCalled();
    const callArg = vi.mocked(mockStream.markdown).mock.calls[0]![0] as string;

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

  it("invokes startOrchestration when /run called with plan ID", async () => {
    const mockStartOrchestration = vi.fn().mockResolvedValue(undefined);
    const mockOrchestration = {
      startOrchestration: mockStartOrchestration,
      cancelOrchestration: vi.fn()
    };
    const mockStream = makeMockStream();
    const mockToken = makeMockToken();

    const dependencies: ChatHandlerDependencies = {
      services: null,
      orchestration: mockOrchestration,
      outputChannel: null
    };

    const handler = buildChatHandler(dependencies);

    const result = await handler(
      { command: "run", prompt: "plan-123" },
      makeMockContext(),
      mockStream,
      mockToken
    );

    expect(mockStartOrchestration).toHaveBeenCalledWith(
      expect.objectContaining({
        planId: "plan-123",
        panel: expect.objectContaining({
          postMessage: expect.any(Function)
        }),
        runId: expect.stringMatching(/^[0-9a-f-]{36}$/), // UUID format
        signal: expect.any(AbortSignal)
      })
    );
    expect(mockStream.markdown).toHaveBeenCalledWith(
      expect.stringContaining("Starting orchestration")
    );
    expect(result).toEqual({});
  });

  it("lists available plans when /run called without plan ID", async () => {
    const mockOrchestration = {
      startOrchestration: vi.fn(),
      cancelOrchestration: vi.fn()
    };
    const mockStream = makeMockStream();

    const dependencies: ChatHandlerDependencies = {
      services: makePartialServices({
        planRegistry: {
          save: vi.fn(),
          getById: vi.fn(),
          list: vi.fn().mockResolvedValue([
            { id: "plan-abc", title: "Plan Alpha" },
            { id: "plan-xyz", title: "Plan Beta" }
          ])
        },
        milestoneRegistry: {
          save: vi.fn(),
          getById: vi.fn(),
          list: vi.fn(),
          listByPlanId: vi.fn()
        }
      }),
      orchestration: mockOrchestration,
      outputChannel: null
    };

    const handler = buildChatHandler(dependencies);

    const result = await handler(
      { command: "run", prompt: "" },
      makeMockContext(),
      mockStream,
      makeMockToken()
    );

    expect(mockOrchestration.startOrchestration).not.toHaveBeenCalled();
    expect(mockStream.markdown).toHaveBeenCalledWith(
      expect.stringContaining("Please specify a plan ID")
    );
    expect(mockStream.markdown).toHaveBeenCalledWith(
      expect.stringContaining("plan-abc")
    );
    expect(mockStream.markdown).toHaveBeenCalledWith(
      expect.stringContaining("plan-xyz")
    );
    expect(result).toEqual({});
  });

  it("responds not available when /run called without orchestration", async () => {
    const mockStream = makeMockStream();

    const dependencies: ChatHandlerDependencies = {
      services: null,
      orchestration: null,
      outputChannel: null
    };

    const handler = buildChatHandler(dependencies);

    const result = await handler(
      { command: "run", prompt: "plan-123" },
      makeMockContext(),
      mockStream,
      makeMockToken()
    );

    expect(mockStream.markdown).toHaveBeenCalledWith(
      "Orchestration not available."
    );
    expect(result).toEqual({});
  });

  it("streams error message when /run orchestration fails", async () => {
    const mockStartOrchestration = vi
      .fn()
      .mockRejectedValue(new Error("plan not found"));
    const mockOrchestration = {
      startOrchestration: mockStartOrchestration,
      cancelOrchestration: vi.fn()
    };
    const mockStream = makeMockStream();
    const mockOutputChannel = { appendLine: vi.fn() };

    const dependencies: ChatHandlerDependencies = {
      services: null,
      orchestration: mockOrchestration,
      outputChannel: mockOutputChannel
    };

    const handler = buildChatHandler(dependencies);

    await handler(
      { command: "run", prompt: "bad-plan" },
      makeMockContext(),
      mockStream,
      makeMockToken()
    );

    await vi.waitFor(() => {
      expect(mockStream.markdown).toHaveBeenCalledWith(
        expect.stringContaining("Orchestration error")
      );
    });

    expect(mockStream.markdown).toHaveBeenCalledWith(
      expect.stringContaining("Orchestration error")
    );
    expect(mockStream.markdown).toHaveBeenCalledWith(
      expect.stringContaining("plan not found")
    );
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringContaining("Attractor: /run error")
    );
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

describe("buildChatHandler logging", () => {
  const makeMockContext = (): ChatContextLike => ({ history: [] });
  const makeMockStream = (): ChatResponseStreamLike => ({
    markdown: vi.fn()
  });
  const makeMockToken = () => ({ onCancellationRequested: vi.fn() });

  it("logs /plan command with plan count", async () => {
    const mockStream = makeMockStream();
    const logLines: string[] = [];

    const dependencies: ChatHandlerDependencies = {
      services: makePartialServices({
        planRegistry: {
          save: vi.fn(),
          getById: vi.fn(),
          list: vi.fn().mockResolvedValue([
            {
              id: "plan-1",
              title: "Test Plan",
              goal: "Test goal",
              status: "ready",
              repositories: []
            }
          ])
        },
        milestoneRegistry: {
          save: vi.fn(),
          getById: vi.fn(),
          list: vi.fn(),
          listByPlanId: vi.fn().mockResolvedValue([{ id: "m1" }])
        }
      }),
      orchestration: null,
      outputChannel: {
        appendLine: (line) => {
          logLines.push(line);
        }
      }
    };

    const handler = buildChatHandler(dependencies);
    const request: ChatRequestLike = { command: "plan", prompt: "test" };

    await handler(request, makeMockContext(), mockStream, makeMockToken());

    expect(
      logLines.some((line) =>
        line.match(/Attractor: \/plan command — 1 plans found/)
      )
    ).toBe(true);
  });

  it("logs /run command with plan ID", async () => {
    const mockStream = makeMockStream();
    const logLines: string[] = [];
    const mockOrchestration = {
      startOrchestration: vi.fn().mockResolvedValue(undefined),
      cancelOrchestration: vi.fn()
    };

    const dependencies: ChatHandlerDependencies = {
      services: null,
      orchestration: mockOrchestration,
      outputChannel: {
        appendLine: (line) => {
          logLines.push(line);
        }
      }
    };

    const handler = buildChatHandler(dependencies);
    const request: ChatRequestLike = { command: "run", prompt: "plan-123" };

    await handler(request, makeMockContext(), mockStream, makeMockToken());

    expect(
      logLines.some((line) =>
        line.match(/Attractor: \/run command — plan=plan-123/)
      )
    ).toBe(true);
  });

  it("does not log when outputChannel is null", async () => {
    const mockStream = makeMockStream();

    const dependencies: ChatHandlerDependencies = {
      services: makePartialServices({
        planRegistry: {
          save: vi.fn(),
          getById: vi.fn(),
          list: vi.fn().mockResolvedValue([])
        },
        milestoneRegistry: {
          save: vi.fn(),
          getById: vi.fn(),
          list: vi.fn(),
          listByPlanId: vi.fn()
        }
      }),
      orchestration: null,
      outputChannel: null
    };

    const handler = buildChatHandler(dependencies);
    const request: ChatRequestLike = { command: "plan", prompt: "test" };

    // Should not throw when outputChannel is null
    await expect(
      handler(request, makeMockContext(), mockStream, makeMockToken())
    ).resolves.toEqual({});
  });
});
