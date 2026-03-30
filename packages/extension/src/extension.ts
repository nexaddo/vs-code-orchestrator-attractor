import { chat, commands, lm, window, type ExtensionContext } from "vscode";

import {
  activateAttractor,
  type ChatApiLike,
  type WindowApiLike
} from "./runtime";
import {
  CopilotModelGateway,
  type ChatModelLike,
  type LanguageModelApiLike
} from "./copilot/copilot-model-gateway";

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

/**
 * Build a LanguageModelApiLike adapter from the VS Code lm namespace.
 */
const createLanguageModelApi = (): LanguageModelApiLike => {
  return {
    async selectChatModels(selector) {
      const models = await lm.selectChatModels({
        vendor: selector.vendor ?? "copilot",
        family: selector.family ?? "gpt-4o"
      });
      // VS Code models are structurally compatible with ChatModelLike
      // (both have sendRequest(messages, options?, token?) returning Thenable<response>)
      return models as unknown as ChatModelLike[];
    },
    createChatMessage(role, content) {
      // Adapt to LanguageModelChatMessageLike shape
      return {
        role,
        content
      };
    }
  };
};

export const activate = (context: ExtensionContext): void => {
  const outputChannel = window.createOutputChannel("Attractor");
  context.subscriptions.push(outputChannel);

  activateAttractor(context, commands, {
    windowApi: createWindowApi(),
    chatApi: createChatApi(),
    modelGateway: new CopilotModelGateway(createLanguageModelApi()),
    outputChannel
  });
};

export const deactivate = (): void => {
  return;
};
