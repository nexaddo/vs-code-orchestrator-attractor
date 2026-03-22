import { describe, expect, it, vi } from "vitest";

import { type ModelGateway } from "../../src/application/ports";
import {
  activateAttractor,
  ATTRACTOR_DASHBOARD_VIEW_TYPE,
  ATTRACTOR_HELLO_COMMAND,
  type ChatApiLike,
  type CommandsApiLike,
  type DisposableLike,
  type ExtensionContextLike,
  type StorageServicesLike,
  type WebviewPanelLike,
  type WindowApiLike
} from "../../src/runtime";

describe("activateAttractor", () => {
  it("registers the placeholder command and stores the disposable", () => {
    const registered: string[] = [];
    const disposable: DisposableLike = {
      dispose: vi.fn()
    };

    const commandsApi: CommandsApiLike = {
      registerCommand(commandId) {
        registered.push(commandId);
        return disposable;
      }
    };

    const context: ExtensionContextLike = {
      subscriptions: []
    };

    activateAttractor(context, commandsApi);

    expect(registered).toEqual([ATTRACTOR_HELLO_COMMAND]);
    expect(context.subscriptions).toEqual([disposable]);
  });

  it("invokes the storage services factory when a storageRoot is provided (v1 seam: result not yet wired)", () => {
    const disposable: DisposableLike = {
      dispose: vi.fn()
    };

    const commandsApi: CommandsApiLike = {
      registerCommand() {
        return disposable;
      }
    };

    const context: ExtensionContextLike = {
      subscriptions: []
    };

    const storageServices: StorageServicesLike = {
      repositoryRegistry: {
        save: vi.fn(),
        getById: vi.fn(),
        list: vi.fn()
      },
      planRegistry: {
        save: vi.fn(),
        getById: vi.fn(),
        list: vi.fn()
      },
      runRegistry: {
        save: vi.fn(),
        getById: vi.fn(),
        list: vi.fn(),
        listActiveRuns: vi.fn()
      },
      eventLog: { append: vi.fn(), listByRun: vi.fn() },
      snapshotProjector: { project: vi.fn() },
      milestoneRunRegistry: {
        save: vi.fn(),
        getById: vi.fn(),
        listByRunId: vi.fn(),
        listByMilestoneId: vi.fn()
      },
      milestoneRegistry: {
        save: vi.fn(),
        getById: vi.fn(),
        list: vi.fn(),
        listByPlanId: vi.fn()
      },
      artifactRegistry: {
        save: vi.fn(),
        getById: vi.fn(),
        listByRunId: vi.fn(),
        listByNodeId: vi.fn()
      }
    };

    const createStorageServices = vi.fn(() => storageServices);

    activateAttractor(context, commandsApi, {
      createStorageServices,
      storageRoot: "C:/tmp/attractor"
    });

    expect(createStorageServices).toHaveBeenCalledWith("C:/tmp/attractor");
  });

  it("does not invoke the storage services factory when no storage root is available", () => {
    const disposable: DisposableLike = { dispose: vi.fn() };
    const commandsApi: CommandsApiLike = {
      registerCommand() {
        return disposable;
      }
    };
    const context: ExtensionContextLike = { subscriptions: [] };
    const createStorageServices = vi.fn();

    activateAttractor(context, commandsApi, { createStorageServices });

    expect(createStorageServices).not.toHaveBeenCalled();
  });

  it("derives storage root from context.storageUri when no explicit root is injected", () => {
    const disposable: DisposableLike = { dispose: vi.fn() };
    const commandsApi: CommandsApiLike = {
      registerCommand() {
        return disposable;
      }
    };
    const context: ExtensionContextLike = {
      subscriptions: [],
      storageUri: { fsPath: "/workspace/.attractor" }
    };

    const storageServices: StorageServicesLike = {
      repositoryRegistry: { save: vi.fn(), getById: vi.fn(), list: vi.fn() },
      planRegistry: { save: vi.fn(), getById: vi.fn(), list: vi.fn() },
      runRegistry: {
        save: vi.fn(),
        getById: vi.fn(),
        list: vi.fn(),
        listActiveRuns: vi.fn()
      },
      eventLog: { append: vi.fn(), listByRun: vi.fn() },
      snapshotProjector: { project: vi.fn() },
      milestoneRunRegistry: {
        save: vi.fn(),
        getById: vi.fn(),
        listByRunId: vi.fn(),
        listByMilestoneId: vi.fn()
      },
      milestoneRegistry: {
        save: vi.fn(),
        getById: vi.fn(),
        list: vi.fn(),
        listByPlanId: vi.fn()
      },
      artifactRegistry: {
        save: vi.fn(),
        getById: vi.fn(),
        listByRunId: vi.fn(),
        listByNodeId: vi.fn()
      }
    };
    const createStorageServices = vi.fn(() => storageServices);

    activateAttractor(context, commandsApi, { createStorageServices });

    expect(createStorageServices).toHaveBeenCalledOnce();
    // path.resolve may normalise the path; just check it was called with the right base
    const firstCallArg = (
      createStorageServices.mock.calls as unknown as Array<[string]>
    )[0]![0];
    expect(firstCallArg).toContain(".attractor");
  });

  it("falls back to context.globalStorageUri when storageUri is absent", () => {
    const disposable: DisposableLike = { dispose: vi.fn() };
    const commandsApi: CommandsApiLike = {
      registerCommand() {
        return disposable;
      }
    };
    const context: ExtensionContextLike = {
      subscriptions: [],
      globalStorageUri: { fsPath: "/home/user/.vscode/attractor" }
    };

    const storageServices: StorageServicesLike = {
      repositoryRegistry: { save: vi.fn(), getById: vi.fn(), list: vi.fn() },
      planRegistry: { save: vi.fn(), getById: vi.fn(), list: vi.fn() },
      runRegistry: {
        save: vi.fn(),
        getById: vi.fn(),
        list: vi.fn(),
        listActiveRuns: vi.fn()
      },
      eventLog: { append: vi.fn(), listByRun: vi.fn() },
      snapshotProjector: { project: vi.fn() },
      milestoneRunRegistry: {
        save: vi.fn(),
        getById: vi.fn(),
        listByRunId: vi.fn(),
        listByMilestoneId: vi.fn()
      },
      milestoneRegistry: {
        save: vi.fn(),
        getById: vi.fn(),
        list: vi.fn(),
        listByPlanId: vi.fn()
      },
      artifactRegistry: {
        save: vi.fn(),
        getById: vi.fn(),
        listByRunId: vi.fn(),
        listByNodeId: vi.fn()
      }
    };
    const createStorageServices = vi.fn(() => storageServices);

    activateAttractor(context, commandsApi, { createStorageServices });

    expect(createStorageServices).toHaveBeenCalledOnce();
    const firstCallArg = (
      createStorageServices.mock.calls as unknown as Array<[string]>
    )[0]![0];
    expect(firstCallArg).toContain("attractor");
  });
});

// ---------------------------------------------------------------------------
// Runtime webview wiring tests
// ---------------------------------------------------------------------------

const makeMinimalContext = (): ExtensionContextLike => ({ subscriptions: [] });

const makeMinimalCommandsApi = (): CommandsApiLike => ({
  registerCommand() {
    return { dispose: vi.fn() };
  }
});

const makeServicesWithMocks = (): StorageServicesLike => ({
  repositoryRegistry: {
    save: vi.fn(),
    getById: vi.fn(),
    list: vi.fn().mockResolvedValue([])
  },
  planRegistry: {
    save: vi.fn(),
    getById: vi.fn(),
    list: vi.fn().mockResolvedValue([])
  },
  runRegistry: {
    save: vi.fn(),
    getById: vi.fn(),
    list: vi.fn().mockResolvedValue([]),
    listActiveRuns: vi.fn().mockResolvedValue([])
  },
  eventLog: { append: vi.fn(), listByRun: vi.fn() },
  snapshotProjector: { project: vi.fn() },
  milestoneRunRegistry: {
    save: vi.fn(),
    getById: vi.fn(),
    listByRunId: vi.fn(),
    listByMilestoneId: vi.fn()
  },
  milestoneRegistry: {
    save: vi.fn(),
    getById: vi.fn(),
    list: vi.fn(),
    listByPlanId: vi.fn()
  },
  artifactRegistry: {
    save: vi.fn(),
    getById: vi.fn(),
    listByRunId: vi.fn(),
    listByNodeId: vi.fn()
  }
});

describe("activateAttractor — runtime webview wiring", () => {
  it("sets onWebviewMessage on the context after activation", () => {
    const context = makeMinimalContext();
    activateAttractor(context, makeMinimalCommandsApi(), {
      createStorageServices: () => makeServicesWithMocks() as never,
      storageRoot: "/tmp/storage"
    });

    expect(context.onWebviewMessage).toBeTypeOf("function");
  });

  it("routes a valid ready message through the bridge and posts one overview.state response", async () => {
    const context = makeMinimalContext();
    activateAttractor(context, makeMinimalCommandsApi(), {
      createStorageServices: () => makeServicesWithMocks() as never,
      storageRoot: "/tmp/storage"
    });

    const posted: unknown[] = [];
    const panel: WebviewPanelLike = {
      postMessage: (m) => {
        posted.push(m);
      }
    };

    await context.onWebviewMessage!(
      { version: 1, requestId: "wiring-test", type: "ready", payload: {} },
      panel
    );

    expect(posted).toHaveLength(1);
    const msg = posted[0] as { type: string; requestId: string };
    expect(msg.type).toBe("overview.state");
    expect(msg.requestId).toBe("wiring-test");
  });

  it("silently ignores a malformed (non-parseable) raw message without throwing", async () => {
    const context = makeMinimalContext();
    activateAttractor(context, makeMinimalCommandsApi(), {
      createStorageServices: () => makeServicesWithMocks() as never,
      storageRoot: "/tmp/storage"
    });

    const posted: unknown[] = [];
    const panel: WebviewPanelLike = {
      postMessage: (m) => {
        posted.push(m);
      }
    };

    // Invalid: missing required fields
    await context.onWebviewMessage!({ not: "a valid message" }, panel);

    expect(posted).toHaveLength(0);
  });

  it("posts degraded overview.state when no storage root is available (services are null)", async () => {
    const context = makeMinimalContext();
    // No storageRoot and no storageUri → services stay null
    activateAttractor(context, makeMinimalCommandsApi(), {});

    const posted: unknown[] = [];
    const panel: WebviewPanelLike = {
      postMessage: (m) => {
        posted.push(m);
      }
    };

    await context.onWebviewMessage!(
      { version: 1, requestId: "no-storage", type: "ready", payload: {} },
      panel
    );

    expect(posted).toHaveLength(1);
    const msg = posted[0] as {
      type: string;
      requestId: string;
      payload: { error: string };
    };
    expect(msg.type).toBe("overview.state");
    expect(msg.requestId).toBe("no-storage");
    expect(msg.payload.error).toContain("Storage unavailable");
  });
});

describe("activateAttractor — startup error boundary", () => {
  it("succeeds with null services when createStorageServices throws", () => {
    const context = makeMinimalContext();
    const log: string[] = [];

    activateAttractor(context, makeMinimalCommandsApi(), {
      storageRoot: "/tmp/storage",
      createStorageServices: () => {
        throw new Error("disk full");
      },
      outputChannel: {
        appendLine: (v) => {
          log.push(v);
        }
      }
    });

    expect(context.onWebviewMessage).toBeTypeOf("function");
    expect(log.some((l) => l.includes("disk full"))).toBe(true);
  });

  it("logs storage root when resolved", () => {
    const context = makeMinimalContext();
    const log: string[] = [];

    activateAttractor(context, makeMinimalCommandsApi(), {
      storageRoot: "/tmp/storage",
      createStorageServices: () => makeServicesWithMocks() as never,
      outputChannel: {
        appendLine: (v) => {
          log.push(v);
        }
      }
    });

    expect(log.some((l) => l.includes("/tmp/storage"))).toBe(true);
  });

  it("continues activation when provider registration throws", () => {
    const context: ExtensionContextLike = {
      subscriptions: [],
      extensionUri: { fsPath: "/repo-root" }
    };
    const log: string[] = [];

    const windowApi: WindowApiLike = {
      registerWebviewViewProvider() {
        throw new Error("provider boom");
      }
    };

    activateAttractor(context, makeMinimalCommandsApi(), {
      createStorageServices: () => makeServicesWithMocks() as never,
      storageRoot: "/tmp/storage",
      windowApi,
      outputChannel: {
        appendLine: (v) => {
          log.push(v);
        }
      }
    });

    expect(context.onWebviewMessage).toBeTypeOf("function");
    expect(log.some((l) => l.includes("provider boom"))).toBe(true);
  });

  it("continues activation when chat registration throws", () => {
    const context: ExtensionContextLike = {
      subscriptions: []
    };
    const log: string[] = [];

    const chatApi: ChatApiLike = {
      createChatParticipant() {
        throw new Error("chat boom");
      }
    };

    activateAttractor(context, makeMinimalCommandsApi(), {
      createStorageServices: () => makeServicesWithMocks() as never,
      storageRoot: "/tmp/storage",
      chatApi,
      outputChannel: {
        appendLine: (v) => {
          log.push(v);
        }
      }
    });

    expect(context.onWebviewMessage).toBeTypeOf("function");
    expect(log.some((l) => l.includes("chat boom"))).toBe(true);
  });

  it("ready message with null services posts degraded overview.state with error field", async () => {
    const context = makeMinimalContext();
    activateAttractor(context, makeMinimalCommandsApi(), {});

    const posted: unknown[] = [];
    const panel: WebviewPanelLike = {
      postMessage: (m) => {
        posted.push(m);
      }
    };

    await context.onWebviewMessage!(
      { version: 1, requestId: "degraded", type: "ready", payload: {} },
      panel
    );

    expect(posted).toHaveLength(1);
    const msg = posted[0] as Record<string, unknown>;
    expect(msg.type).toBe("overview.state");
    expect((msg.payload as { error: string }).error).toContain(
      "Storage unavailable"
    );
    expect(
      (msg.payload as { stats: { totalRepos: number } }).stats.totalRepos
    ).toBe(0);
  });

  it("logs activation lifecycle messages to the outputChannel seam", () => {
    const context = makeMinimalContext();
    const log: string[] = [];

    activateAttractor(context, makeMinimalCommandsApi(), {
      storageRoot: "/tmp/storage",
      createStorageServices: () => makeServicesWithMocks() as never,
      outputChannel: {
        appendLine: (v) => {
          log.push(v);
        }
      }
    });

    expect(log.some((l) => l.includes("activating"))).toBe(true);
    expect(log.some((l) => l.includes("activation complete"))).toBe(true);
  });

  it("logs webview message handler errors to the outputChannel instead of console.error", async () => {
    const context = makeMinimalContext();
    const log: string[] = [];

    const throwingServices = makeServicesWithMocks();
    (
      throwingServices.runRegistry.list as ReturnType<typeof vi.fn>
    ).mockRejectedValue(new Error("registry exploded"));

    activateAttractor(context, makeMinimalCommandsApi(), {
      storageRoot: "/tmp/storage",
      createStorageServices: () => throwingServices as never,
      outputChannel: {
        appendLine: (v) => {
          log.push(v);
        }
      }
    });

    const panel: WebviewPanelLike = {
      postMessage: vi.fn()
    };

    // Send a valid "ready" message — handleWebviewMessage will call projectOverview
    // which calls runRegistry.list(), which rejects
    await context.onWebviewMessage!(
      { version: 1, requestId: "err-test", type: "ready", payload: {} },
      panel
    );

    expect(log.some((l) => l.includes("registry exploded"))).toBe(true);
    expect(
      log.some((l) => l.includes("failed to handle webview message"))
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Provider registration tests (Slice 2)
// ---------------------------------------------------------------------------

describe("activateAttractor — webview provider registration", () => {
  it("registers the view provider when extensionUri and windowApi are both provided", () => {
    const context: ExtensionContextLike = {
      subscriptions: [],
      extensionUri: { fsPath: "/repo-root" }
    };

    const registeredViewTypes: string[] = [];
    const providerDisposable: DisposableLike = { dispose: vi.fn() };
    const windowApi: WindowApiLike = {
      registerWebviewViewProvider(viewType) {
        registeredViewTypes.push(viewType);
        return providerDisposable;
      }
    };

    activateAttractor(context, makeMinimalCommandsApi(), {
      createStorageServices: () => makeServicesWithMocks() as never,
      storageRoot: "/tmp/storage",
      windowApi
    });

    expect(registeredViewTypes).toEqual([ATTRACTOR_DASHBOARD_VIEW_TYPE]);
    expect(context.subscriptions).toContain(providerDisposable);
  });

  it("does not register the view provider when extensionUri is absent", () => {
    const context = makeMinimalContext();
    const windowApi: WindowApiLike = {
      registerWebviewViewProvider: vi.fn(() => ({ dispose: vi.fn() }))
    };

    activateAttractor(context, makeMinimalCommandsApi(), {
      createStorageServices: () => makeServicesWithMocks() as never,
      storageRoot: "/tmp/storage",
      windowApi
    });

    expect(windowApi.registerWebviewViewProvider).not.toHaveBeenCalled();
  });

  it("does not register the view provider when windowApi is absent", () => {
    const context: ExtensionContextLike = {
      subscriptions: [],
      extensionUri: { fsPath: "/repo-root" }
    };

    // No windowApi → should not throw
    activateAttractor(context, makeMinimalCommandsApi(), {
      createStorageServices: () => makeServicesWithMocks() as never,
      storageRoot: "/tmp/storage"
    });

    // Only the command disposable should be present, no provider
    expect(context.subscriptions).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Chat participant registration tests (Slice 7)
// ---------------------------------------------------------------------------

describe("activateAttractor — chat participant registration", () => {
  it("registers the chat participant when chatApi is provided", () => {
    const context: ExtensionContextLike = {
      subscriptions: []
    };

    const participantDisposable: DisposableLike = { dispose: vi.fn() };
    const chatApi: ChatApiLike = {
      createChatParticipant: vi.fn(() => participantDisposable)
    };

    activateAttractor(context, makeMinimalCommandsApi(), {
      createStorageServices: () => makeServicesWithMocks() as never,
      storageRoot: "/tmp/storage",
      chatApi
    });

    expect(chatApi.createChatParticipant).toHaveBeenCalledWith(
      "attractor.attractor",
      expect.any(Function)
    );
    expect(context.subscriptions).toContain(participantDisposable);
  });

  it("does not register the chat participant when chatApi is undefined", () => {
    const context: ExtensionContextLike = {
      subscriptions: []
    };

    // No chatApi → should not throw
    activateAttractor(context, makeMinimalCommandsApi(), {
      createStorageServices: () => makeServicesWithMocks() as never,
      storageRoot: "/tmp/storage"
    });

    // Only the command disposable should be present, no chat participant
    expect(context.subscriptions).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Model gateway injection tests (Slice 9)
// ---------------------------------------------------------------------------

describe("activateAttractor — model gateway injection", () => {
  it("accepts a custom ModelGateway in dependencies", () => {
    const context: ExtensionContextLike = {
      subscriptions: []
    };

    const customGateway: ModelGateway = {
      send: vi.fn().mockResolvedValue("response"),
      stream: vi.fn().mockResolvedValue(undefined)
    };

    // Should not throw when custom gateway is provided
    activateAttractor(context, makeMinimalCommandsApi(), {
      createStorageServices: () => makeServicesWithMocks() as never,
      storageRoot: "/tmp/storage",
      modelGateway: customGateway
    });

    expect(context.subscriptions).toHaveLength(1);
  });

  it("defaults to NoOpModelGateway when none is provided", () => {
    const context: ExtensionContextLike = {
      subscriptions: []
    };

    // Should not throw without modelGateway
    activateAttractor(context, makeMinimalCommandsApi(), {
      createStorageServices: () => makeServicesWithMocks() as never,
      storageRoot: "/tmp/storage"
    });

    expect(context.subscriptions).toHaveLength(1);
  });
});
