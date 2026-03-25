/**
 * Integration tests for store dispatch via messageDispatch.
 *
 * These tests verify that the full dispatch chain from inbound message
 * → messageDispatch → store reducer → state update works correctly.
 *
 * Coverage gap: message-dispatch.test.ts validates dispatch routing logic,
 * but does NOT verify that the store STATE changes persist correctly when
 * multiple message types coexist in the store simultaneously.
 */

import { describe, expect, it } from "vitest";

import { dispatchInboundMessage } from "../../src/app/message-dispatch";
import { createStore, createInitialState } from "../../src/app/store";

describe("store-dispatch integration", () => {
  it("graph.update: dispatches graphUpdate to store", () => {
    // This tests the full dispatch chain which IS covered by message-dispatch.test.ts
    // but NOT the store integration where graphUpdate field must persist in state.
    const store = createStore();

    dispatchInboundMessage(store, {
      type: "graph.update",
      payload: { nodeId: "n1", status: "complete" }
    });

    const state = store.getState();
    expect(state.graphUpdate).not.toBeNull();
    expect(state.graphUpdate).toEqual({
      nodeId: "n1",
      status: "complete"
    });
  });

  it("orchestration.state: dispatches orchestration to store", () => {
    // This tests the full dispatch chain which IS covered by message-dispatch.test.ts
    // but NOT the store integration where orchestration field must persist with
    // normalized phases.
    const store = createStore();

    dispatchInboundMessage(store, {
      type: "orchestration.state",
      payload: {
        runId: "r1",
        milestoneIndex: 0,
        milestoneCount: 3,
        milestoneName: "Setup",
        phases: [
          { role: "orchestrator", status: "done" },
          { role: "planner", status: "running" },
          { role: "implementer", status: "queued" },
          { role: "reviewer", status: "queued" }
        ]
      }
    });

    const state = store.getState();
    expect(state.orchestration).not.toBeNull();
    expect(state.orchestration?.runId).toBe("r1");
    expect(state.orchestration?.milestoneIndex).toBe(0);
    expect(state.orchestration?.milestoneCount).toBe(3);
    expect(state.orchestration?.milestoneName).toBe("Setup");
    expect(state.orchestration?.phases).toHaveLength(4);
    expect(state.orchestration?.phases[1].status).toBe("running");
  });

  it("both message types: coexist in store simultaneously", () => {
    // This tests simultaneous coexistence which is NOT covered by
    // message-dispatch.test.ts (each test there dispatches only one message type).
    // This validates that graph.update and orchestration.state do not
    // overwrite each other's store fields.
    const store = createStore();

    // Dispatch graph.update first
    dispatchInboundMessage(store, {
      type: "graph.update",
      payload: { nodeId: "n2", status: "running" }
    });

    // Then dispatch orchestration.state
    dispatchInboundMessage(store, {
      type: "orchestration.state",
      payload: {
        runId: "r2",
        milestoneIndex: 1,
        milestoneCount: 5,
        milestoneName: "Implementation",
        phases: [
          { role: "orchestrator", status: "done" },
          { role: "planner", status: "done" },
          { role: "implementer", status: "running" },
          { role: "reviewer", status: "queued" }
        ]
      }
    });

    const state = store.getState();

    // Both fields must be populated simultaneously
    expect(state.graphUpdate).not.toBeNull();
    expect(state.graphUpdate).toEqual({
      nodeId: "n2",
      status: "running"
    });

    expect(state.orchestration).not.toBeNull();
    expect(state.orchestration?.runId).toBe("r2");
    expect(state.orchestration?.milestoneIndex).toBe(1);
    expect(state.orchestration?.milestoneName).toBe("Implementation");
    expect(state.orchestration?.phases[2].status).toBe("running");
  });
});
