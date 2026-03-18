import { describe, expect, it, vi } from "vitest";

import {
  activateAttractor,
  ATTRACTOR_HELLO_COMMAND,
  ATTRACTOR_PLAN_CREATE_COMMAND,
  ATTRACTOR_RUN_CANCEL_COMMAND,
  ATTRACTOR_RUN_START_COMMAND,
  type CommandsApiLike,
  type DisposableLike,
  type ExtensionContextLike
} from "../../src/runtime";

describe("activateAttractor", () => {
  it("registers all commands and stores disposables", () => {
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

    expect(registered).toContain(ATTRACTOR_HELLO_COMMAND);
    expect(registered).toContain(ATTRACTOR_RUN_START_COMMAND);
    expect(registered).toContain(ATTRACTOR_RUN_CANCEL_COMMAND);
    expect(registered).toContain(ATTRACTOR_PLAN_CREATE_COMMAND);
    expect(context.subscriptions).toHaveLength(4);
  });
});
