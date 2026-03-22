import {
  type OrchestrationStatePayload,
  type AgentRoleStatus,
  type OrchestratorHandoff,
  type PlannerHandoff,
  type ImplementerHandoff,
  type ReviewerHandoff
} from "@attractor/shared";

type Role = "orchestrator" | "planner" | "implementer" | "reviewer";

import type { ModelGateway, ModelMessage } from "./ports";
import {
  buildOrchestratorSystemPrompt,
  buildOrchestratorUserMessage,
  buildPlannerSystemPrompt,
  buildPlannerUserMessage,
  buildImplementerSystemPrompt,
  buildImplementerUserMessage,
  buildReviewerSystemPrompt,
  buildReviewerUserMessage,
  type OrchestratorPromptContext,
  type PlannerPromptContext,
  type ImplementerPromptContext,
  type ReviewerPromptContext
} from "./role-prompts";
import {
  buildOrchestratorHandoff,
  buildPlannerHandoff,
  buildImplementerHandoff,
  buildReviewerHandoff,
  parseHandoffResponse
} from "./handoffs";

/**
 * Milestone input for the orchestration loop.
 */
export interface MilestoneInput {
  id: string;
  name: string;
  order: number;
  description: string;
  acceptanceCriteria: string[];
}

/**
 * Options for running the orchestration loop.
 */
export interface OrchestrationOptions {
  modelGateway: ModelGateway;
  milestones: MilestoneInput[];
  runId: string;
  planTitle: string;
  planGoal: string;
  onStateChange: (state: OrchestrationStatePayload) => void;
  onHandoff: (
    handoff:
      | OrchestratorHandoff
      | PlannerHandoff
      | ImplementerHandoff
      | ReviewerHandoff,
    role: Role
  ) => void;
  onError: (error: Error, milestoneId: string, role: Role) => void;
  signal?: AbortSignal;
}

/**
 * Internal state for tracking handoffs between phases.
 */
interface PhaseResults {
  orchestratorHandoff?: OrchestratorHandoff;
  plannerHandoff?: PlannerHandoff;
  implementerHandoff?: ImplementerHandoff;
  reviewerHandoff?: ReviewerHandoff;
}

/**
 * Build messages for a specific role based on context and prior handoffs.
 */
function buildMessagesForRole(
  role: Role,
  milestone: MilestoneInput,
  options: OrchestrationOptions,
  phaseResults: PhaseResults
): ModelMessage[] {
  switch (role) {
    case "orchestrator": {
      const context: OrchestratorPromptContext = {
        planTitle: options.planTitle,
        planGoal: options.planGoal,
        currentMilestoneId: milestone.id,
        currentMilestoneName: milestone.name,
        milestones: options.milestones.map((m) => ({
          id: m.id,
          title: m.name,
          order: m.order,
          acceptanceCriteria: m.acceptanceCriteria
        }))
      };
      return [
        ...buildOrchestratorSystemPrompt(context),
        ...buildOrchestratorUserMessage(context)
      ];
    }

    case "planner": {
      const context: PlannerPromptContext = {
        milestoneName: milestone.name,
        milestoneId: milestone.id,
        description: milestone.description,
        acceptanceCriteria: milestone.acceptanceCriteria
      };

      if (phaseResults.orchestratorHandoff) {
        context.priorHandoffSummary = `Orchestrator handoff: ${phaseResults.orchestratorHandoff.description}`;
      }

      return [
        ...buildPlannerSystemPrompt(context),
        ...buildPlannerUserMessage(context)
      ];
    }

    case "implementer": {
      if (!phaseResults.plannerHandoff) {
        throw new Error("Planner handoff required for implementer phase");
      }

      const priorHandoffSummary = `Planner handoff: ${phaseResults.plannerHandoff.tasks.length} tasks planned, ${phaseResults.plannerHandoff.filesLikelyAffected.length} files likely affected`;

      const context: ImplementerPromptContext = {
        milestoneName: milestone.name,
        milestoneId: milestone.id,
        tasks: phaseResults.plannerHandoff.tasks,
        filesLikelyAffected: phaseResults.plannerHandoff.filesLikelyAffected,
        priorHandoffSummary
      };
      return [
        ...buildImplementerSystemPrompt(context),
        ...buildImplementerUserMessage(context)
      ];
    }

    case "reviewer": {
      if (!phaseResults.implementerHandoff) {
        throw new Error("Implementer handoff required for reviewer phase");
      }

      const priorHandoffSummary = `Implementer handoff: ${phaseResults.implementerHandoff.tasksCompleted.length} tasks completed, tests ${phaseResults.implementerHandoff.testsPassed ? "passed" : "failed"}`;

      const context: ReviewerPromptContext = {
        milestoneName: milestone.name,
        milestoneId: milestone.id,
        tasksCompleted: phaseResults.implementerHandoff.tasksCompleted,
        implementationSummary: phaseResults.implementerHandoff.summary,
        testsPassed: phaseResults.implementerHandoff.testsPassed,
        priorHandoffSummary
      };
      return [
        ...buildReviewerSystemPrompt(context),
        ...buildReviewerUserMessage(context)
      ];
    }
  }
}

/**
 * Orchestrates multi-agent execution across milestones.
 */
export class OrchestrationLoop {
  /**
   * Execute the full orchestration loop across all milestones.
   * Milestones are processed in order-field ascending sort.
   * Each milestone goes through 4 phases: orchestrator → planner → implementer → reviewer.
   */
  async execute(options: OrchestrationOptions): Promise<void> {
    // Sort milestones by order ascending
    const sortedMilestones = [...options.milestones].sort(
      (a, b) => a.order - b.order
    );

    // Process each milestone sequentially
    for (let i = 0; i < sortedMilestones.length; i++) {
      const milestone = sortedMilestones[i];
      if (!milestone) continue;

      // Check abort signal before starting milestone
      if (options.signal?.aborted) {
        // Remaining milestones are skipped; exit cleanly
        return;
      }

      await this.executeMilestone(
        milestone,
        i,
        sortedMilestones.length,
        options
      );
    }
  }

  /**
   * Execute all phases for a single milestone.
   */
  private async executeMilestone(
    milestone: MilestoneInput,
    milestoneIndex: number,
    milestoneCount: number,
    options: OrchestrationOptions
  ): Promise<void> {
    const phaseResults: PhaseResults = {};

    // Track status of all 4 phases
    const roleStatuses: Record<Role, AgentRoleStatus> = {
      orchestrator: "waiting",
      planner: "waiting",
      implementer: "waiting",
      reviewer: "waiting"
    };

    const emitState = () => {
      const state: OrchestrationStatePayload = {
        runId: options.runId,
        milestoneIndex,
        milestoneCount,
        milestoneName: milestone.name,
        phases: [
          { role: "orchestrator", status: roleStatuses.orchestrator },
          { role: "planner", status: roleStatuses.planner },
          { role: "implementer", status: roleStatuses.implementer },
          { role: "reviewer", status: roleStatuses.reviewer }
        ]
      };
      try {
        options.onStateChange(state);
      } catch {
        // Observer failure must not affect orchestration flow
      }
    };

    // Initial state: all waiting
    emitState();

    // Phase 1: Orchestrator
    const orchestratorSuccess = await this.executePhase(
      "orchestrator",
      milestone,
      options,
      phaseResults,
      roleStatuses,
      emitState
    );
    if (!orchestratorSuccess) return;

    // Phase 2: Planner
    const plannerSuccess = await this.executePhase(
      "planner",
      milestone,
      options,
      phaseResults,
      roleStatuses,
      emitState
    );
    if (!plannerSuccess) return;

    // Phase 3: Implementer
    const implementerSuccess = await this.executePhase(
      "implementer",
      milestone,
      options,
      phaseResults,
      roleStatuses,
      emitState
    );
    if (!implementerSuccess) return;

    // Phase 4: Reviewer
    await this.executePhase(
      "reviewer",
      milestone,
      options,
      phaseResults,
      roleStatuses,
      emitState
    );
  }

  /**
   * Execute a single phase for a milestone.
   * @returns true if phase succeeded, false if it failed (milestone should stop)
   */
  private async executePhase(
    role: Role,
    milestone: MilestoneInput,
    options: OrchestrationOptions,
    phaseResults: PhaseResults,
    roleStatuses: Record<Role, AgentRoleStatus>,
    emitState: () => void
  ): Promise<boolean> {
    // Check abort before starting phase
    if (options.signal?.aborted) {
      roleStatuses[role] = "canceled" as AgentRoleStatus;
      emitState();
      return false;
    }

    // Mark phase as running
    roleStatuses[role] = "running";
    emitState();

    try {
      // Build messages for this role
      const messages = buildMessagesForRole(
        role,
        milestone,
        options,
        phaseResults
      );

      // Send to model
      const rawResponse = await options.modelGateway.send(
        messages,
        options.signal ? { signal: options.signal } : undefined
      );

      // Check abort after send (signal may have fired during await)
      if (options.signal?.aborted && role !== "reviewer") {
        roleStatuses[role] = "canceled" as AgentRoleStatus;
        emitState();
        return false;
      }

      // Parse handoff based on role
      let handoff:
        | OrchestratorHandoff
        | PlannerHandoff
        | ImplementerHandoff
        | ReviewerHandoff;

      switch (role) {
        case "orchestrator": {
          const parsed = parseHandoffResponse(rawResponse);
          const parsedObj = parsed as {
            milestoneId?: string;
            milestoneName?: string;
            description?: string;
            acceptanceCriteria?: string[];
          };

          if (
            parsedObj.milestoneId !== undefined &&
            parsedObj.milestoneId !== milestone.id
          ) {
            throw new Error(
              `Orchestrator milestoneId mismatch: expected "${milestone.id}", got "${parsedObj.milestoneId}"`
            );
          }

          if (
            parsedObj.milestoneName !== undefined &&
            parsedObj.milestoneName !== milestone.name
          ) {
            throw new Error(
              `Orchestrator milestoneName mismatch: expected "${milestone.name}", got "${parsedObj.milestoneName}"`
            );
          }

          handoff = buildOrchestratorHandoff(
            milestone.id,
            milestone.name,
            parsedObj.description ?? milestone.description,
            parsedObj.acceptanceCriteria ?? milestone.acceptanceCriteria
          );
          phaseResults.orchestratorHandoff = handoff;
          break;
        }

        case "planner": {
          handoff = buildPlannerHandoff(rawResponse, milestone.id);
          phaseResults.plannerHandoff = handoff;
          break;
        }

        case "implementer": {
          handoff = buildImplementerHandoff(rawResponse, milestone.id);
          phaseResults.implementerHandoff = handoff;
          break;
        }

        case "reviewer": {
          handoff = buildReviewerHandoff(rawResponse, milestone.id);
          phaseResults.reviewerHandoff = handoff;
          // Gate on reviewer approval
          if (!phaseResults.reviewerHandoff.approved) {
            throw new Error("Review rejected: changes required");
          }
          break;
        }
      }

      // Emit handoff (observer failure must not affect orchestration flow)
      try {
        options.onHandoff(handoff, role);
      } catch {
        // Observer failure must not affect orchestration flow
      }

      // Mark phase as done
      roleStatuses[role] = "done";
      emitState();

      return true;
    } catch (error) {
      // Mark phase as failed
      roleStatuses[role] = "failed";
      emitState();

      // Emit error
      options.onError(
        error instanceof Error ? error : new Error(String(error)),
        milestone.id,
        role
      );

      return false;
    }
  }
}
