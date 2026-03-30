import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MilestoneRecord, PlanRecord, RunRecord } from "@attractor/shared";

const { executeMock } = vi.hoisted(() => ({
  executeMock: vi.fn()
}));

vi.mock("../../src/application/orchestration-loop", () => ({
  OrchestrationLoop: class {
    execute = executeMock;
  }
}));

import {
  activateAttractor,
  type CommandsApiLike,
  type ExtensionContextLike,
  type StorageServicesLike,
  type WebviewPanelLike
} from "../../src/runtime";
import type { ModelGateway } from "../../src/application/ports";

const makePlan = (id = "plan-1"): PlanRecord => ({
  version: 1,
  id,
  title: "Ship Runtime Orchestration",
  goal: "Wire runtime orchestration end-to-end",
  status: "ready",
  repositories: [
    {
      repositoryId: "repo-1",
      role: "executable",
      access: "read_write",
      mountAlias: "app"
    }
  ],
  primaryExecutableRepositoryId: "repo-1",
  graphSource: "digraph { start -> exit }",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

const makeMilestone = (
  id: string,
  planId: string,
  title: string,
  order: number
): MilestoneRecord => ({
  version: 1,
  id,
  planId,
  title,
  order,
  status: "pending",
  acceptanceCriteria: ["criterion-a", "criterion-b"],
  nodeIds: ["node-1"]
});

const makeCommandsApi = (): CommandsApiLike => ({
  registerCommand: () => ({ dispose: vi.fn() })
});

const makeContext = (): ExtensionContextLike => ({
  subscriptions: []
});

const makePanel = (): { panel: WebviewPanelLike; posted: unknown[] } => {
  const posted: unknown[] = [];
  return {
    panel: {
      postMessage: (message) => {
        posted.push(message);
      }
    },
    posted
  };
};

const makeGateway = (): ModelGateway => ({
  send: vi.fn().mockResolvedValue("{}"),
  stream: vi.fn().mockResolvedValue(undefined)
});

const makeServices = (overrides?: {
  plan?: PlanRecord | null;
  milestones?: MilestoneRecord[];
}) => {
  const resolvedPlan =
    overrides && "plan" in overrides ? overrides.plan : makePlan();
  const runSave = vi.fn(async (record: RunRecord) => record);
  const eventAppend = vi.fn(async () => undefined);

  const services: StorageServicesLike = {
    repositoryRegistry: {
      save: vi.fn(),
      getById: vi.fn(),
      list: vi.fn().mockResolvedValue([])
    },
    planRegistry: {
      save: vi.fn(),
      getById: vi.fn().mockResolvedValue(resolvedPlan),
      list: vi.fn().mockResolvedValue([])
    },
    runRegistry: {
      save: runSave,
      getById: vi.fn(),
      list: vi.fn().mockResolvedValue([]),
      listActiveRuns: vi.fn().mockResolvedValue([])
    },
    eventLog: {
      append: eventAppend,
      listByRun: vi.fn().mockResolvedValue([])
    },
    snapshotProjector: { project: vi.fn() },
    milestoneRunRegistry: {
      save: vi.fn(),
      getById: vi.fn(),
      listByRunId: vi.fn(),
      listByMilestoneId: vi.fn()
    },
    milestoneRegistry: {
      save: vi.fn(),
      getById: vi.fn(),
      list: vi.fn().mockResolvedValue([]),
      listByPlanId: vi
        .fn()
        .mockResolvedValue(
          overrides?.milestones ?? [
            makeMilestone("m-1", "plan-1", "First Milestone", 1)
          ]
        )
    },
    artifactRegistry: {
      save: vi.fn(),
      getById: vi.fn(),
      listByRunId: vi.fn(),
      listByNodeId: vi.fn()
    }
  };

  return { services, runSave, eventAppend };
};

const waitForRunToSettle = async (runSave: ReturnType<typeof vi.fn>) => {
  await vi.waitFor(() => {
    expect(runSave).toHaveBeenCalledTimes(2);
  });
};

describe("runtime startOrchestration", () => {
  beforeEach(() => {
    executeMock.mockReset();
  });

  it("loads plan+milestones, maps inputs, executes loop, and completes run", async () => {
    executeMock.mockImplementation(async (options) => {
      options.onStateChange({
        runId: options.runId,
        milestoneIndex: 0,
        milestoneCount: options.milestones.length,
        milestoneName: options.milestones[0]?.name ?? "",
        phases: [
          { role: "orchestrator", status: "running" },
          { role: "planner", status: "waiting" },
          { role: "implementer", status: "waiting" },
          { role: "reviewer", status: "waiting" }
        ]
      });
      options.onHandoff(
        {
          milestoneId: options.milestones[0]?.id ?? "m-1",
          milestoneName: options.milestones[0]?.name ?? "First Milestone",
          description: "handoff",
          acceptanceCriteria: []
        } as never,
        "orchestrator"
      );
    });

    const milestones = [
      makeMilestone("m-2", "plan-1", "Second Milestone", 2),
      makeMilestone("m-1", "plan-1", "First Milestone", 1)
    ];
    const { services, runSave, eventAppend } = makeServices({ milestones });
    const context = makeContext();
    const gateway = makeGateway();
    const logLines: string[] = [];
    const { panel, posted } = makePanel();

    activateAttractor(context, makeCommandsApi(), {
      storageRoot: "/tmp/storage",
      createStorageServices: () => services as never,
      modelGateway: gateway,
      outputChannel: {
        appendLine: (line) => {
          logLines.push(line);
        }
      }
    });

    await context.onWebviewMessage!(
      {
        version: 1,
        requestId: "req-run-happy",
        type: "plan.run",
        payload: { planId: "plan-1", runId: "run-1" }
      },
      panel
    );

    await waitForRunToSettle(runSave);

    expect(executeMock).toHaveBeenCalledOnce();
    const options = executeMock.mock.calls[0]?.[0];
    expect(options.modelGateway).toBe(gateway);
    expect(options.runId).toBe("run-1");
    expect(options.planTitle).toBe("Ship Runtime Orchestration");
    expect(options.planGoal).toBe("Wire runtime orchestration end-to-end");
    expect(options.milestones).toStrictEqual([
      {
        id: "m-1",
        name: "First Milestone",
        order: 1,
        description: "First Milestone",
        acceptanceCriteria: ["criterion-a", "criterion-b"]
      },
      {
        id: "m-2",
        name: "Second Milestone",
        order: 2,
        description: "Second Milestone",
        acceptanceCriteria: ["criterion-a", "criterion-b"]
      }
    ]);

    const firstSave = runSave.mock.calls[0]?.[0] as RunRecord;
    const finalSave = runSave.mock.calls[1]?.[0] as RunRecord;
    expect(firstSave.status).toBe("running");
    expect(firstSave.startedAt).toBeDefined();
    expect(finalSave.status).toBe("completed");
    expect(finalSave.completedAt).toBeDefined();

    const runStateMessage = posted.find(
      (msg) => (msg as { type?: string }).type === "run.state"
    ) as { version: number; payload: { runId: string } };
    expect(runStateMessage.version).toBe(1);
    expect(runStateMessage.payload.runId).toBe("run-1");

    const handoffMessage = posted.find(
      (msg) => (msg as { type?: string }).type === "run.handoff"
    ) as { version: number };
    expect(handoffMessage.version).toBe(1);
    expect(eventAppend).toHaveBeenCalledOnce();
    expect(logLines.some((line) => line.includes("failed"))).toBe(false);
  });

  it("logs orchestration lifecycle events to OutputChannel", async () => {
    executeMock.mockImplementation(async (options) => {
      // Simulate state change
      options.onStateChange({
        runId: options.runId,
        milestoneIndex: 0,
        milestoneCount: options.milestones.length,
        milestoneName: options.milestones[0]?.name ?? "",
        phases: [
          { role: "orchestrator", status: "running" },
          { role: "planner", status: "waiting" },
          { role: "implementer", status: "waiting" },
          { role: "reviewer", status: "waiting" }
        ]
      });

      // Simulate handoff
      options.onHandoff(
        {
          milestoneId: options.milestones[0]?.id ?? "m-1",
          milestoneName: options.milestones[0]?.name ?? "First Milestone",
          description: "handoff description",
          acceptanceCriteria: []
        } as never,
        "orchestrator"
      );
    });

    const { services, runSave } = makeServices();
    const context = makeContext();
    const { panel } = makePanel();
    const logLines: string[] = [];

    activateAttractor(context, makeCommandsApi(), {
      storageRoot: "/tmp/storage",
      createStorageServices: () => services as never,
      modelGateway: makeGateway(),
      outputChannel: {
        appendLine: (line) => {
          logLines.push(line);
        }
      }
    });

    await context.onWebviewMessage!(
      {
        version: 1,
        requestId: "req-logging-test",
        type: "plan.run",
        payload: { planId: "plan-1", runId: "run-logging-test" }
      },
      panel
    );

    await waitForRunToSettle(runSave);

    // Verify all expected log messages
    expect(
      logLines.some((line) =>
        line.match(
          /Attractor: orchestration started — run=run-logging-test plan=plan-1/
        )
      )
    ).toBe(true);

    expect(
      logLines.some((line) =>
        line.match(
          /Attractor: plan loaded — Ship Runtime Orchestration \(1 milestones\)/
        )
      )
    ).toBe(true);

    expect(
      logLines.some((line) =>
        line.match(/Attractor: milestone 1\/1 — First Milestone/)
      )
    ).toBe(true);

    expect(
      logLines.some((line) =>
        line.match(/Attractor: handoff orchestrator — m-1/)
      )
    ).toBe(true);

    expect(
      logLines.some((line) =>
        line.match(
          /Attractor: orchestration completed — run=run-logging-test duration=\d+ms/
        )
      )
    ).toBe(true);
  });

  it("logs error when onError callback is invoked", async () => {
    executeMock.mockImplementation(async (options) => {
      options.onError(new Error("test error message"), "m-1", "planner");
    });

    const { services, runSave } = makeServices();
    const context = makeContext();
    const { panel } = makePanel();
    const logLines: string[] = [];

    activateAttractor(context, makeCommandsApi(), {
      storageRoot: "/tmp/storage",
      createStorageServices: () => services as never,
      modelGateway: makeGateway(),
      outputChannel: {
        appendLine: (line) => {
          logLines.push(line);
        }
      }
    });

    await context.onWebviewMessage!(
      {
        version: 1,
        requestId: "req-error-test",
        type: "plan.run",
        payload: { planId: "plan-1", runId: "run-error-test" }
      },
      panel
    );

    await waitForRunToSettle(runSave);

    expect(
      logLines.some((line) =>
        line.match(
          /Attractor: error in planner at milestone m-1 — test error message/
        )
      )
    ).toBe(true);

    expect(
      logLines.some((line) =>
        line.match(
          /Attractor: orchestration failed — run=run-error-test duration=\d+ms/
        )
      )
    ).toBe(true);
  });

  it("fails gracefully when plan is missing", async () => {
    const { services, runSave } = makeServices({ plan: null });
    const context = makeContext();
    const { panel, posted } = makePanel();
    const logLines: string[] = [];

    activateAttractor(context, makeCommandsApi(), {
      storageRoot: "/tmp/storage",
      createStorageServices: () => services as never,
      modelGateway: makeGateway(),
      outputChannel: {
        appendLine: (line) => {
          logLines.push(line);
        }
      }
    });

    await context.onWebviewMessage!(
      {
        version: 1,
        requestId: "req-missing-plan",
        type: "plan.run",
        payload: { planId: "plan-404", runId: "run-missing-plan" }
      },
      panel
    );

    await waitForRunToSettle(runSave);

    expect(executeMock).not.toHaveBeenCalled();
    const finalSave = runSave.mock.calls[1]?.[0] as RunRecord;
    expect(finalSave.status).toBe("failed");
    expect(logLines.some((line) => line.includes("Plan not found"))).toBe(true);
    expect(
      posted.some((msg) => (msg as { type?: string }).type === "run.error")
    ).toBe(true);
  });

  it("fails gracefully when milestone list is empty", async () => {
    const { services, runSave } = makeServices({ milestones: [] });
    const context = makeContext();
    const { panel } = makePanel();
    const logLines: string[] = [];

    activateAttractor(context, makeCommandsApi(), {
      storageRoot: "/tmp/storage",
      createStorageServices: () => services as never,
      modelGateway: makeGateway(),
      outputChannel: {
        appendLine: (line) => {
          logLines.push(line);
        }
      }
    });

    await context.onWebviewMessage!(
      {
        version: 1,
        requestId: "req-empty-milestones",
        type: "plan.run",
        payload: { planId: "plan-1", runId: "run-empty-milestones" }
      },
      panel
    );

    await waitForRunToSettle(runSave);

    expect(executeMock).not.toHaveBeenCalled();
    const finalSave = runSave.mock.calls[1]?.[0] as RunRecord;
    expect(finalSave.status).toBe("failed");
    expect(
      logLines.some((line) => line.includes("No milestones found for plan"))
    ).toBe(true);
  });

  it("marks run as failed when loop execution throws", async () => {
    executeMock.mockRejectedValue(new Error("loop exploded"));

    const { services, runSave } = makeServices();
    const context = makeContext();
    const { panel } = makePanel();
    const logLines: string[] = [];

    activateAttractor(context, makeCommandsApi(), {
      storageRoot: "/tmp/storage",
      createStorageServices: () => services as never,
      modelGateway: makeGateway(),
      outputChannel: {
        appendLine: (line) => {
          logLines.push(line);
        }
      }
    });

    await context.onWebviewMessage!(
      {
        version: 1,
        requestId: "req-loop-throws",
        type: "plan.run",
        payload: { planId: "plan-1", runId: "run-loop-throws" }
      },
      panel
    );

    await waitForRunToSettle(runSave);

    const firstSave = runSave.mock.calls[0]?.[0] as RunRecord;
    const finalSave = runSave.mock.calls[1]?.[0] as RunRecord;
    expect(firstSave.status).toBe("running");
    expect(finalSave.status).toBe("failed");
    expect(logLines.some((line) => line.includes("loop exploded"))).toBe(true);
  });

  it("forwards cancellation to the loop AbortSignal and settles run", async () => {
    let sawAbort = false;
    executeMock.mockImplementation(
      async (options: { signal?: AbortSignal }): Promise<void> => {
        await new Promise<void>((resolve) => {
          if (options.signal?.aborted) {
            sawAbort = true;
            resolve();
            return;
          }
          options.signal?.addEventListener(
            "abort",
            () => {
              sawAbort = true;
              resolve();
            },
            { once: true }
          );
        });
      }
    );

    const { services, runSave } = makeServices();
    const context = makeContext();
    const { panel } = makePanel();

    activateAttractor(context, makeCommandsApi(), {
      storageRoot: "/tmp/storage",
      createStorageServices: () => services as never,
      modelGateway: makeGateway()
    });

    await context.onWebviewMessage!(
      {
        version: 1,
        requestId: "req-run-abort-start",
        type: "plan.run",
        payload: { planId: "plan-1", runId: "run-abort" }
      },
      panel
    );

    await context.onWebviewMessage!(
      {
        version: 1,
        requestId: "req-run-abort-cancel",
        type: "run.cancel",
        payload: { runId: "run-abort" }
      },
      panel
    );

    await waitForRunToSettle(runSave);

    expect(sawAbort).toBe(true);
    const finalSave = runSave.mock.calls[1]?.[0] as RunRecord;
    expect(["completed", "failed"]).toContain(finalSave.status);
  });
});
