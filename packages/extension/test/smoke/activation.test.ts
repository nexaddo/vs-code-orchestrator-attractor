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

  it("obtains storage services through the provided runtime seam", () => {
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
});
