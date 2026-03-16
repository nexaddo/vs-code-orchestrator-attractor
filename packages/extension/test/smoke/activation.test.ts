import { describe, expect, it, vi } from "vitest";

import {
  activateAttractor,
  ATTRACTOR_HELLO_COMMAND,
  type CommandsApiLike,
  type DisposableLike,
  type ExtensionContextLike,
  type StorageServicesLike
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
        list: vi.fn()
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
      runRegistry: { save: vi.fn(), getById: vi.fn(), list: vi.fn() }
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
      runRegistry: { save: vi.fn(), getById: vi.fn(), list: vi.fn() }
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
