import { describe, expect, it } from "vitest";

import {
  type ChatApiLike,
  type ChatHandlerDependencies,
  type ChatRequestHandler,
  PARTICIPANT_ID,
  registerChatParticipant
} from "../../src/chat/attractor-chat-participant";

/**
 * Integration tests for chat participant registration wiring.
 * These tests verify registration details NOT covered by activation.test.ts smoke tests.
 */
describe("registerChatParticipant — registration wiring", () => {
  const makeNullDependencies = (): ChatHandlerDependencies => ({
    services: null,
    orchestration: null,
    outputChannel: null
  });

  it("registers with the exact PARTICIPANT_ID constant value", () => {
    // This tests that the registration uses PARTICIPANT_ID="attractor.attractor" explicitly,
    // which is NOT covered by activation.test.ts (that test only verifies createChatParticipant was called).

    let capturedId: string | undefined;

    const chatApi: ChatApiLike = {
      createChatParticipant(participantId) {
        capturedId = participantId;
        return { dispose: () => {} };
      }
    };

    registerChatParticipant(chatApi, makeNullDependencies());

    expect(capturedId).toBe(PARTICIPANT_ID);
    expect(capturedId).toBe("attractor.attractor");
  });

  it("wires a non-null handler function to the participant", () => {
    // This tests that the handler passed to createChatParticipant is a valid function,
    // which is NOT covered by activation.test.ts (that test only checks expect.any(Function)).

    let capturedHandler: ChatRequestHandler | undefined;

    const chatApi: ChatApiLike = {
      createChatParticipant(_participantId, handler) {
        capturedHandler = handler;
        return { dispose: () => {} };
      }
    };

    registerChatParticipant(chatApi, makeNullDependencies());

    expect(capturedHandler).toBeDefined();
    expect(capturedHandler).not.toBeNull();
    expect(typeof capturedHandler).toBe("function");
  });
});
