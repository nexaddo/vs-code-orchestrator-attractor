import type {
  AgentRolePhase,
  GraphNode,
  GraphRecord,
  ImplementerHandoff,
  OrchestratorHandoff,
  OrchestrationStatePayload,
  PlannerHandoff,
  ReviewerHandoff
} from "@attractor/shared";
import {
  ImplementerHandoffSchema,
  OrchestratorHandoffSchema,
  PlannerHandoffSchema,
  ReviewerHandoffSchema
} from "@attractor/shared";
import type { ModelGateway } from "./ports";
import {
  buildImplementerSystemPrompt,
  buildImplementerUserMessage,
  buildOrchestratorSystemPrompt,
  buildOrchestratorUserMessage,
  buildPlannerSystemPrompt,
  buildPlannerUserMessage,
  buildReviewerSystemPrompt,
  buildReviewerUserMessage
} from "./role-prompts";

export interface OrchestrationOptions {
  runId: string;
  graph: GraphRecord;
  worktreePath: string;
  onStateUpdate: (state: OrchestrationStatePayload) => void;
}

type FourPhases = [
  AgentRolePhase,
  AgentRolePhase,
  AgentRolePhase,
  AgentRolePhase
];

function makeInitialPhases(): FourPhases {
  return [
    { role: "orchestrator", status: "waiting" },
    { role: "planner", status: "waiting" },
    { role: "implementer", status: "waiting" },
    { role: "reviewer", status: "waiting" }
  ];
}

function parseHandoff<T>(raw: string, schema: { parse(input: unknown): T }): T {
  const jsonMatch = /\{[\s\S]*\}/.exec(raw);
  const jsonStr = jsonMatch !== null ? jsonMatch[0] : raw;
  const parsed: unknown = JSON.parse(jsonStr);
  return schema.parse(parsed);
}

export class OrchestrationLoop {
  constructor(private readonly modelGateway: ModelGateway) {}

  async execute(options: OrchestrationOptions): Promise<void> {
    const { runId, graph, worktreePath, onStateUpdate } = options;
    const nodes = this.topologicalSort(graph.nodes);
    const milestoneCount = nodes.length;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node === undefined) continue;

      const milestoneIndex = i + 1;
      const phases = makeInitialPhases();

      const emitState = (updatedPhases: FourPhases): void => {
        onStateUpdate({
          runId,
          milestoneIndex,
          milestoneCount,
          milestoneName: node.label,
          phases: updatedPhases
        });
      };

      // ── Phase 1: Orchestrator ────────────────────────────────────────────
      phases[0] = { role: "orchestrator", status: "running" };
      emitState([...phases] as FourPhases);

      let orchestratorHandoff: OrchestratorHandoff;
      try {
        const response = await this.modelGateway.send(
          [{ role: "user", content: buildOrchestratorUserMessage(node) }],
          { systemPrompt: buildOrchestratorSystemPrompt() }
        );
        orchestratorHandoff = parseHandoff(response, OrchestratorHandoffSchema);
        phases[0] = {
          role: "orchestrator",
          status: "done",
          taskSummary: orchestratorHandoff.description
        };
      } catch (err) {
        phases[0] = {
          role: "orchestrator",
          status: "failed",
          errorLabel: String(err)
        };
        phases[1] = { role: "planner", status: "skipped" };
        phases[2] = { role: "implementer", status: "skipped" };
        phases[3] = { role: "reviewer", status: "skipped" };
        emitState([...phases] as FourPhases);
        continue;
      }
      emitState([...phases] as FourPhases);

      // ── Phase 2: Planner ─────────────────────────────────────────────────
      phases[1] = { role: "planner", status: "running" };
      emitState([...phases] as FourPhases);

      let plannerHandoff: PlannerHandoff;
      try {
        const response = await this.modelGateway.send(
          [
            {
              role: "user",
              content: buildPlannerUserMessage(orchestratorHandoff)
            }
          ],
          { systemPrompt: buildPlannerSystemPrompt() }
        );
        plannerHandoff = parseHandoff(response, PlannerHandoffSchema);
        phases[1] = {
          role: "planner",
          status: "done",
          taskSummary: `${plannerHandoff.tasks.length} tasks planned`
        };
      } catch (err) {
        phases[1] = {
          role: "planner",
          status: "failed",
          errorLabel: String(err)
        };
        phases[2] = { role: "implementer", status: "skipped" };
        phases[3] = { role: "reviewer", status: "skipped" };
        emitState([...phases] as FourPhases);
        continue;
      }
      emitState([...phases] as FourPhases);

      // ── Phase 3: Implementer ─────────────────────────────────────────────
      phases[2] = { role: "implementer", status: "running" };
      emitState([...phases] as FourPhases);

      let implementerHandoff: ImplementerHandoff;
      try {
        const response = await this.modelGateway.send(
          [
            {
              role: "user",
              content: buildImplementerUserMessage(plannerHandoff)
            }
          ],
          { systemPrompt: buildImplementerSystemPrompt(worktreePath) }
        );
        implementerHandoff = parseHandoff(response, ImplementerHandoffSchema);
        phases[2] = {
          role: "implementer",
          status: "done",
          taskSummary: implementerHandoff.summary
        };
      } catch (err) {
        phases[2] = {
          role: "implementer",
          status: "failed",
          errorLabel: String(err)
        };
        phases[3] = { role: "reviewer", status: "skipped" };
        emitState([...phases] as FourPhases);
        continue;
      }
      emitState([...phases] as FourPhases);

      // ── Phase 4: Reviewer ────────────────────────────────────────────────
      phases[3] = { role: "reviewer", status: "running" };
      emitState([...phases] as FourPhases);

      try {
        const response = await this.modelGateway.send(
          [
            {
              role: "user",
              content: buildReviewerUserMessage(implementerHandoff)
            }
          ],
          { systemPrompt: buildReviewerSystemPrompt() }
        );
        const reviewerHandoff: ReviewerHandoff = parseHandoff(
          response,
          ReviewerHandoffSchema
        );
        phases[3] = reviewerHandoff.approved
          ? {
              role: "reviewer",
              status: "done",
              taskSummary: reviewerHandoff.comments.join("; ") || "Approved"
            }
          : {
              role: "reviewer",
              status: "failed",
              errorLabel:
                reviewerHandoff.comments.join("; ") || "Changes required"
            };
      } catch (err) {
        phases[3] = {
          role: "reviewer",
          status: "failed",
          errorLabel: String(err)
        };
      }
      emitState([...phases] as FourPhases);
    }
  }

  private topologicalSort(nodes: GraphNode[]): GraphNode[] {
    const result: GraphNode[] = [];
    const visited = new Set<string>();

    const visit = (node: GraphNode): void => {
      if (visited.has(node.id)) return;
      visited.add(node.id);
      for (const depId of node.dependsOn) {
        const dep = nodes.find((n) => n.id === depId);
        if (dep !== undefined) visit(dep);
      }
      result.push(node);
    };

    for (const node of nodes) {
      visit(node);
    }
    return result;
  }
}
