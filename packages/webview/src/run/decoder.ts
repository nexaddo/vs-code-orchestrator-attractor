import { z } from "zod";
import {
  WebviewOutboundMessageSchema,
  RunStatePayloadSchema,
  OrchestrationStatePayloadSchema
} from "@attractor/shared";
import type { AgentRolePhase } from "@attractor/shared";
import type { AgentRolePhaseView, OrchestrationState, RunState } from "./model";

const RunMessageSchema = WebviewOutboundMessageSchema.extend({
  type: z.literal("run.state"),
  payload: RunStatePayloadSchema
});

const OrchestrationMessageSchema = WebviewOutboundMessageSchema.extend({
  type: z.literal("orchestration.state"),
  payload: OrchestrationStatePayloadSchema
});

export function decodeRunState(
  data: unknown
): { success: true; state: RunState } | { success: false; error: string } {
  try {
    const parsed = RunMessageSchema.parse(data);
    const state: RunState = {
      run: parsed.payload.run,
      plan: parsed.payload.plan,
      currentStep: parsed.payload.currentStep,
      logTail: parsed.payload.logTail
    };
    if (parsed.payload.repositories !== undefined) {
      state.repositories = parsed.payload.repositories;
    }
    return { success: true, state };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.errors
        .map((e) => {
          const location = e.path.length > 0 ? e.path.join(".") : "(root)";
          return `${location}: ${e.message}`;
        })
        .join(", ");
      return {
        success: false,
        error: `Failed to decode run.state: ${detail}`
      };
    }
    return {
      success: false,
      error: `Failed to decode run.state: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

function mapPhase(raw: AgentRolePhase): AgentRolePhaseView {
  const phase: AgentRolePhaseView = { role: raw.role, status: raw.status };
  if (raw.taskSummary !== undefined) phase.taskSummary = raw.taskSummary;
  if (raw.errorLabel !== undefined) phase.errorLabel = raw.errorLabel;
  return phase;
}

export function decodeOrchestrationState(
  data: unknown
):
  | { success: true; state: OrchestrationState }
  | { success: false; error: string } {
  try {
    const parsed = OrchestrationMessageSchema.parse(data);
    return {
      success: true,
      state: {
        runId: parsed.payload.runId,
        milestoneIndex: parsed.payload.milestoneIndex,
        milestoneCount: parsed.payload.milestoneCount,
        milestoneName: parsed.payload.milestoneName,
        phases: parsed.payload.phases.map(mapPhase)
      }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.errors
        .map((e) => {
          const location = e.path.length > 0 ? e.path.join(".") : "(root)";
          return `${location}: ${e.message}`;
        })
        .join(", ");
      return {
        success: false,
        error: `Failed to decode orchestration.state: ${detail}`
      };
    }
    return {
      success: false,
      error: `Failed to decode orchestration.state: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
