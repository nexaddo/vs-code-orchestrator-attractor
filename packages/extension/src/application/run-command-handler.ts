import type { EventPublisher } from "./ports";

export interface StartRunCommand {
  readonly planId: string;
  readonly correlationId: string;
}

export class RunCommandHandler {
  constructor(private readonly publisher: EventPublisher) {}

  async startRun(command: StartRunCommand): Promise<void> {
    // TODO(M2): allocate worktree, persist RunRecord, emit RunCreated event
    void command;
    await Promise.resolve();
  }
}
