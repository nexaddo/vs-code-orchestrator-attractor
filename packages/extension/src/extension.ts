import { chat, commands, window, type ExtensionContext } from "vscode";

import {
  activateAttractor,
  type ChatApiLike,
  type WindowApiLike
} from "./runtime";

/**
 * Build a WindowApiLike adapter from the VS Code window namespace.
 */
const createWindowApi = (): WindowApiLike => {
  return {
    registerWebviewViewProvider(viewType, provider) {
      return window.registerWebviewViewProvider(viewType, {
        resolveWebviewView(webviewView: unknown) {
          provider.resolveWebviewView(webviewView);
        }
      });
    }
  };
};

/**
 * Build a ChatApiLike adapter from the VS Code chat namespace.
 */
const createChatApi = (): ChatApiLike => {
  return {
    createChatParticipant(participantId, handler) {
      const participant = chat.createChatParticipant(
        participantId,
        async (request, context, stream, token) => {
          // Adapt VS Code types to ChatApiLike seam types
          const adaptedRequest: {
            command?: string;
            prompt: string;
          } = {
            prompt: request.prompt
          };
          if (request.command !== undefined) {
            adaptedRequest.command = request.command;
          }
          const adaptedContext = {
            history: [...context.history]
          };
          const adaptedStream = {
            markdown: (value: string) => stream.markdown(value)
          };
          return handler(adaptedRequest, adaptedContext, adaptedStream, token);
        }
      );
      return { dispose: () => participant.dispose() };
    }
  };
};

export const activate = (context: ExtensionContext): void => {
  activateAttractor(context, commands, {
    windowApi: createWindowApi(),
    chatApi: createChatApi()
  });
};

export const deactivate = (): void => {
  return;
};
