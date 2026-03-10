import { describe, expect, it, vi } from "vitest";

import {
  activateAttractor,
  ATTRACTOR_HELLO_COMMAND,
  type CommandsApiLike,
  type DisposableLike,
  type ExtensionContextLike
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
});
