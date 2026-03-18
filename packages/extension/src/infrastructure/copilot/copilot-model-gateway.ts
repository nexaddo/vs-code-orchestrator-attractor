import * as vscode from "vscode";

import type {
  ModelGateway,
  ModelMessage,
  ModelRequestOptions
} from "../../application/ports";

export class CopilotModelGateway implements ModelGateway {
  private async getModel(): Promise<vscode.LanguageModelChat> {
    const models = await vscode.lm.selectChatModels({
      vendor: "copilot",
      family: "gpt-4o"
    });
    const model = models[0];
    if (model === undefined) {
      throw new Error(
        "No Copilot language model available. Ensure GitHub Copilot Chat is installed and signed in."
      );
    }
    return model;
  }

  private toVsCodeMessages(
    messages: ModelMessage[],
    options?: ModelRequestOptions
  ): vscode.LanguageModelChatMessage[] {
    const result: vscode.LanguageModelChatMessage[] = [];
    if (options?.systemPrompt !== undefined) {
      result.push(vscode.LanguageModelChatMessage.User(options.systemPrompt));
    }
    for (const msg of messages) {
      if (msg.role === "user") {
        result.push(vscode.LanguageModelChatMessage.User(msg.content));
      } else {
        result.push(vscode.LanguageModelChatMessage.Assistant(msg.content));
      }
    }
    return result;
  }

  async send(
    messages: ModelMessage[],
    options?: ModelRequestOptions
  ): Promise<string> {
    const model = await this.getModel();
    const vsMessages = this.toVsCodeMessages(messages, options);
    const cts = new vscode.CancellationTokenSource();
    try {
      const request = await model.sendRequest(vsMessages, {}, cts.token);
      let text = "";
      for await (const part of request.stream) {
        if (part instanceof vscode.LanguageModelTextPart) {
          text += part.value;
        }
      }
      return text;
    } finally {
      cts.dispose();
    }
  }

  async stream(
    messages: ModelMessage[],
    onChunk: (text: string) => void,
    options?: ModelRequestOptions
  ): Promise<void> {
    const model = await this.getModel();
    const vsMessages = this.toVsCodeMessages(messages, options);
    const cts = new vscode.CancellationTokenSource();
    try {
      const request = await model.sendRequest(vsMessages, {}, cts.token);
      for await (const part of request.stream) {
        if (part instanceof vscode.LanguageModelTextPart) {
          onChunk(part.value);
        }
      }
    } finally {
      cts.dispose();
    }
  }
}
