/**
 * Orchestration Eval Harness
 *
 * Measures orchestration quality across deterministic replay scenarios:
 *   - stepCompletionRate: % of phases that finish in "done"
 *   - errorRecoveryRate:  % of milestones that attempt execution after a prior failure
 *   - planAdherence:      % of milestone transitions that respect topological order
 *
 * Results are written to <repo-root>/test-results/eval-metrics.json so CI can
 * upload them as an artifact.  The test itself asserts on threshold gates.
 */
import fs from "fs/promises";
import path from "path";

import { afterAll, describe, expect, it } from "vitest";

import { OrchestrationLoop } from "../../src/application/orchestration-loop";
import type {
  MilestoneInput,
  OrchestrationOptions
} from "../../src/application/orchestration-loop";
import type {
  ModelGateway,
  ModelMessage
} from "../../src/application/ports";
import type { GraphRecord, OrchestrationStatePayload } from "@attractor/shared";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract system message content from a messages array. */
function getSysContent(msgs: ModelMessage[]): string {
  return msgs.find((m) => m.role === "system")?.content ?? "";
}

/** Convert a GraphRecord to MilestoneInput[] for the orchestration loop. */
function graphToMilestones(graph: GraphRecord): MilestoneInput[] {
  return graph.nodes.map((node, i) => ({
    id: node.id,
    name: node.label,
    order: i,
    description: node.label,
    acceptanceCriteria: ["Implementation complete"]
  }));
}

// ── Shared fixture responses ──────────────────────────────────────────────────

// Orchestrator fixture: only description + acceptanceCriteria (no milestoneId —
// the loop supplies the ID from context and validates any ID provided).
const ORCHESTRATOR_OK = JSON.stringify({
  description: "Implement feature.",
  acceptanceCriteria: ["Tests pass", "No regressions"]
});

const PLANNER_OK = JSON.stringify({
  version: 1,
  milestoneId: "X",
  tasks: [{ id: "t1", description: "Write code", testFirst: true }],
  filesLikelyAffected: ["src/feature.ts"]
});

const IMPLEMENTER_OK = JSON.stringify({
  version: 1,
  milestoneId: "X",
  tasksCompleted: ["t1"],
  summary: "Feature implemented with tests.",
  testsPassed: true
});

const REVIEWER_OK = JSON.stringify({
  version: 1,
  milestoneId: "X",
  approved: true,
  comments: ["LGTM"],
  requiresChanges: false
});

// ── Gateway builders ──────────────────────────────────────────────────────────

/** All phases always succeed. */
function makeHappyGateway(): ModelGateway {
  return {
    send: async (msgs: ModelMessage[]): Promise<string> => {
      const sys = getSysContent(msgs);
      if (sys.includes("acceptanceCriteria")) return ORCHESTRATOR_OK;
      if (sys.includes("filesLikelyAffected")) return PLANNER_OK;
      if (sys.includes("testsPassed")) return IMPLEMENTER_OK;
      if (sys.includes("requiresChanges")) return REVIEWER_OK;
      throw new Error(`Unexpected system prompt: ${sys.slice(0, 60)}`);
    },
    stream: async () => undefined
  };
}

/**
 * Implementer always throws; all other phases succeed.
 * Tests that the loop skips reviewer and continues to next milestone.
 */
function makeImplementerFailGateway(): ModelGateway {
  return {
    send: async (msgs: ModelMessage[]): Promise<string> => {
      const sys = getSysContent(msgs);
      if (sys.includes("acceptanceCriteria")) return ORCHESTRATOR_OK;
      if (sys.includes("filesLikelyAffected")) return PLANNER_OK;
      if (sys.includes("testsPassed"))
        throw new Error("Implementer unavailable");
      if (sys.includes("requiresChanges")) return REVIEWER_OK;
      throw new Error(`Unexpected system prompt: ${sys.slice(0, 60)}`);
    },
    stream: async () => undefined
  };
}

/**
 * Orchestrator always throws; all three downstream phases are skipped.
 * Tests that the loop continues to the next milestone regardless.
 */
function makeOrchestratorFailGateway(): ModelGateway {
  return {
    send: async (msgs: ModelMessage[]): Promise<string> => {
      const sys = getSysContent(msgs);
      if (sys.includes("acceptanceCriteria"))
        throw new Error("Orchestrator unavailable");
      if (sys.includes("filesLikelyAffected")) return PLANNER_OK;
      if (sys.includes("testsPassed")) return IMPLEMENTER_OK;
      if (sys.includes("requiresChanges")) return REVIEWER_OK;
      throw new Error(`Unexpected system prompt: ${sys.slice(0, 60)}`);
    },
    stream: async () => undefined
  };
}

// ── Graph helpers ─────────────────────────────────────────────────────────────

const makeGraph = (
  nodes: GraphRecord["nodes"],
  id = "graph-eval"
): GraphRecord => ({
  version: 1,
  id,
  planId: "plan-eval",
  source: `digraph { ${nodes.map((n) => n.id).join(" ")} }`,
  nodes,
  createdAt: "2026-01-01T00:00:00.000Z"
});

// ── Metrics computation ───────────────────────────────────────────────────────

interface ScenarioResult {
  name: string;
  stepCompletionRate: number;
  errorRecoveryRate: number | null; // null when there are no failures
  planAdherence: number;
  milestonesRun: number;
  phasesDone: number;
  phasesFailed: number;
  phasesSkipped: number;
}

/** Collect the last emitted state per milestoneIndex (the terminal state). */
function collectFinals(
  states: OrchestrationStatePayload[]
): Map<number, OrchestrationStatePayload> {
  const finals = new Map<number, OrchestrationStatePayload>();
  for (const s of states) finals.set(s.milestoneIndex, s);
  return finals;
}

function computeMetrics(
  states: OrchestrationStatePayload[],
  expectedMilestoneOrder: string[]
): Omit<ScenarioResult, "name"> {
  const finals = collectFinals(states);

  let phasesDone = 0;
  let phasesFailed = 0;
  let phasesSkipped = 0;

  for (const state of finals.values()) {
    for (const phase of state.phases) {
      if (phase.status === "done") phasesDone++;
      else if (phase.status === "failed") phasesFailed++;
      // "waiting" in a terminal milestone state means the phase was never reached
      else if (phase.status === "skipped" || phase.status === "waiting")
        phasesSkipped++;
    }
  }

  const totalPhases = phasesDone + phasesFailed + phasesSkipped;
  const stepCompletionRate = totalPhases === 0 ? 1 : phasesDone / totalPhases;

  // Error recovery: for each milestone with a failure, did all subsequent
  // milestones still attempt execution?
  const failedIndices = [...finals.entries()]
    .filter(([, s]) => s.phases.some((p) => p.status === "failed"))
    .map(([i]) => i);

  let errorRecoveryRate: number | null = null;
  if (failedIndices.length > 0) {
    let opportunities = 0;
    let recoveries = 0;
    for (const fi of failedIndices) {
      const later = [...finals.keys()].filter((i) => i > fi);
      for (const li of later) {
        opportunities++;
        const s = finals.get(li)!;
        // "Attempted" = orchestrator phase is not "waiting"
        if (s.phases[0]?.status !== "waiting") recoveries++;
      }
    }
    errorRecoveryRate = opportunities === 0 ? 1 : recoveries / opportunities;
  }

  // Plan adherence: milestone names emitted in first-seen order vs expected.
  const seenNames: string[] = [];
  for (const s of states) {
    if (!seenNames.includes(s.milestoneName)) seenNames.push(s.milestoneName);
  }

  let correctTransitions = 0;
  let totalTransitions = 0;
  for (let i = 0; i < seenNames.length - 1; i++) {
    const aIdx = expectedMilestoneOrder.indexOf(seenNames[i]!);
    const bIdx = expectedMilestoneOrder.indexOf(seenNames[i + 1]!);
    if (aIdx !== -1 && bIdx !== -1) {
      totalTransitions++;
      if (aIdx < bIdx) correctTransitions++;
    }
  }
  const planAdherence =
    totalTransitions === 0 ? 1 : correctTransitions / totalTransitions;

  return {
    stepCompletionRate,
    errorRecoveryRate,
    planAdherence,
    milestonesRun: finals.size,
    phasesDone,
    phasesFailed,
    phasesSkipped
  };
}

// ── Eval report accumulator ───────────────────────────────────────────────────

const scenarioResults: ScenarioResult[] = [];

async function runScenario(
  name: string,
  gateway: ModelGateway,
  graph: GraphRecord,
  expectedMilestoneOrder: string[]
): Promise<ScenarioResult> {
  const loop = new OrchestrationLoop();
  const states: OrchestrationStatePayload[] = [];
  const milestones = graphToMilestones(graph);
  const options: OrchestrationOptions = {
    modelGateway: gateway,
    milestones,
    runId: `eval-${name}`,
    planTitle: "Eval Plan",
    planGoal: "Complete all milestones",
    onStateChange: (s) => states.push(s),
    onHandoff: () => {},
    onError: () => {}
  };
  await loop.execute(options);
  const result: ScenarioResult = {
    name,
    ...computeMetrics(states, expectedMilestoneOrder)
  };
  scenarioResults.push(result);
  return result;
}

// ── Write metrics report after all tests ─────────────────────────────────────

afterAll(async () => {
  // Resolve repo root: packages/extension/test/evals/ → ../../../../
  const repoRoot = path.resolve(__dirname, "../../../..");
  const outDir = path.join(repoRoot, "test-results");
  await fs.mkdir(outDir, { recursive: true });

  const overallStepCompletion =
    scenarioResults.length === 0
      ? 1
      : scenarioResults.reduce((sum, r) => sum + r.stepCompletionRate, 0) /
        scenarioResults.length;

  const recoveryScenarios = scenarioResults.filter(
    (r) => r.errorRecoveryRate !== null
  );
  const overallRecovery =
    recoveryScenarios.length === 0
      ? 1
      : recoveryScenarios.reduce((sum, r) => sum + r.errorRecoveryRate!, 0) /
        recoveryScenarios.length;

  const overallAdherence =
    scenarioResults.length === 0
      ? 1
      : scenarioResults.reduce((sum, r) => sum + r.planAdherence, 0) /
        scenarioResults.length;

  const report = {
    timestamp: new Date().toISOString(),
    scenarios: scenarioResults,
    summary: {
      stepCompletionRate: overallStepCompletion,
      errorRecoveryRate: overallRecovery,
      planAdherence: overallAdherence
    }
  };

  await fs.writeFile(
    path.join(outDir, "eval-metrics.json"),
    JSON.stringify(report, null, 2),
    "utf8"
  );
});

// ── Scenarios ─────────────────────────────────────────────────────────────────

describe("Orchestration Evals", () => {
  it("scenario: happy-path — 3-node linear graph, all phases succeed", async () => {
    const graph = makeGraph([
      { id: "A", label: "Milestone A", dependsOn: [] },
      { id: "B", label: "Milestone B", dependsOn: ["A"] },
      { id: "C", label: "Milestone C", dependsOn: ["B"] }
    ]);

    const result = await runScenario("happy-path", makeHappyGateway(), graph, [
      "Milestone A",
      "Milestone B",
      "Milestone C"
    ]);

    expect(result.stepCompletionRate).toBeGreaterThanOrEqual(0.9);
    expect(result.planAdherence).toBe(1);
    expect(result.milestonesRun).toBe(3);
    expect(result.phasesFailed).toBe(0);
    expect(result.phasesSkipped).toBe(0);
  });

  it("scenario: implementer-failure — loop skips reviewer but continues to next milestone", async () => {
    const graph = makeGraph([
      { id: "A", label: "Milestone A", dependsOn: [] },
      { id: "B", label: "Milestone B", dependsOn: [] }
    ]);

    const result = await runScenario(
      "implementer-failure",
      makeImplementerFailGateway(),
      graph,
      ["Milestone A", "Milestone B"]
    );

    // Both A and B use the same gateway → both fail at implementer
    // A: orchestrator+planner done, implementer failed, reviewer skipped
    // B: orchestrator+planner done, implementer failed, reviewer skipped
    // done=4, failed=2, skipped=2 → rate = 4/8 = 0.5
    expect(result.stepCompletionRate).toBeCloseTo(0.5, 2);
    expect(result.phasesFailed).toBe(2);
    expect(result.phasesSkipped).toBe(2);
    expect(result.errorRecoveryRate).toBe(1); // B still ran after A failed
  });

  it("scenario: orchestrator-failure — loop skips all downstream phases but continues to next milestone", async () => {
    const graph = makeGraph([
      { id: "A", label: "Milestone A", dependsOn: [] },
      { id: "B", label: "Milestone B", dependsOn: [] }
    ]);

    const result = await runScenario(
      "orchestrator-failure",
      makeOrchestratorFailGateway(),
      graph,
      ["Milestone A", "Milestone B"]
    );

    // A: orchestrator failed, planner+implementer+reviewer skipped
    // B: orchestrator failed, same pattern
    // done=0, failed=2, skipped=6 → rate = 0/8 = 0
    expect(result.stepCompletionRate).toBe(0);
    expect(result.phasesFailed).toBe(2);
    expect(result.phasesSkipped).toBe(6);
    // B still attempted (both milestones fail, B follows A) → recovery = 1
    expect(result.errorRecoveryRate).toBe(1);
  });

  it("scenario: mixed — first milestone fully succeeds, second has implementer failure", async () => {
    // A succeeds, B fails at implementer
    let callCount = 0;
    const gateway: ModelGateway = {
      send: async (msgs: ModelMessage[]): Promise<string> => {
        const sys = getSysContent(msgs);
        if (sys.includes("acceptanceCriteria")) {
          callCount++;
          return ORCHESTRATOR_OK;
        }
        if (sys.includes("filesLikelyAffected")) return PLANNER_OK;
        if (sys.includes("testsPassed")) {
          // Fail only on the second milestone's implementer
          if (callCount > 1) throw new Error("Implementer failed on B");
          return IMPLEMENTER_OK;
        }
        if (sys.includes("requiresChanges")) return REVIEWER_OK;
        throw new Error(`Unexpected system prompt: ${sys.slice(0, 60)}`);
      },
      stream: async () => undefined
    };

    const graph = makeGraph([
      { id: "A", label: "Alpha", dependsOn: [] },
      { id: "B", label: "Beta", dependsOn: ["A"] }
    ]);

    const result = await runScenario("mixed-success-failure", gateway, graph, [
      "Alpha",
      "Beta"
    ]);

    // A: 4 done; B: 2 done (orchestrator+planner) + 1 failed (implementer) + 1 skipped (reviewer)
    expect(result.phasesDone).toBe(6);
    expect(result.phasesFailed).toBe(1);
    expect(result.phasesSkipped).toBe(1);
    expect(result.planAdherence).toBe(1); // Alpha executed before Beta
    // B is the last milestone so no recovery opportunity exists → trivially 1
    expect(result.errorRecoveryRate).toBe(1);
  });

  it("eval gate: error recovery rate must be 100% across all failure scenarios", () => {
    const failureScenarios = scenarioResults.filter(
      (r) => r.errorRecoveryRate !== null
    );
    for (const s of failureScenarios) {
      expect(
        s.errorRecoveryRate,
        `Scenario "${s.name}" must recover from errors`
      ).toBe(1);
    }
  });

  it("eval gate: plan adherence must be 100% across all scenarios", () => {
    for (const s of scenarioResults) {
      expect(
        s.planAdherence,
        `Scenario "${s.name}" must execute milestones in dependency order`
      ).toBe(1);
    }
  });
});
