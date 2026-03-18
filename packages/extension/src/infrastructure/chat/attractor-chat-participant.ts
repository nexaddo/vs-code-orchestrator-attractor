import type * as vscode from "vscode";

export const PARTICIPANT_ID = "attractor.attractor";

export interface ChatParticipantHandler {
  (
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    response: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): void | Promise<void>;
}

export interface ChatApiLike {
  createChatParticipant(
    id: string,
    handler: ChatParticipantHandler
  ): vscode.ChatParticipant;
}

export function buildChatHandler(): ChatParticipantHandler {
  return async (
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    response: vscode.ChatResponseStream
  ): Promise<void> => {
    const { command, prompt } = request;
    switch (command) {
      case "plan":
        response.progress("Creating plan...");
        response.markdown(
          `**Plan:** ${prompt.length > 0 ? prompt : "no goal provided"}\n\nUse the \`attractor.plan.create\` command or provide a goal to create a full plan.`
        );
        break;

      case "run":
        response.progress("Starting orchestration run...");
        response.markdown(
          "Starting Attractor run. Use `attractor.run.start` command to kick off an orchestration workflow. Monitor progress in the Attractor dashboard."
        );
        break;

      case "status":
        response.markdown(
          "**Attractor** is active. Use `/plan <goal>` to create a plan or `/run` to start a run."
        );
        break;

      default:
        response.markdown(
          "**Attractor** — graph-driven coding workflows\n\n" +
            "Available commands:\n" +
            "- `/plan <goal>` — create a new plan from a natural-language goal\n" +
            "- `/run` — start an orchestration run on the active plan\n" +
            "- `/status` — check current Attractor status"
        );
        break;
    }
  };
}

export function registerChatParticipant(
  chatApi: ChatApiLike,
  context: { subscriptions: { dispose(): void }[] }
): vscode.ChatParticipant {
  const participant = chatApi.createChatParticipant(
    PARTICIPANT_ID,
    buildChatHandler()
  );
  context.subscriptions.push(participant);
  return participant;
}
