import { z } from "zod";
import {
  WebviewOutboundMessageSchema,
  PlanStatePayloadSchema
} from "@attractor/shared";
import type { PlanState } from "./model";

const PlanMessageSchema = WebviewOutboundMessageSchema.extend({
  type: z.literal("plan.state"),
  payload: PlanStatePayloadSchema
});

export function decodePlanState(
  data: unknown
): { success: true; state: PlanState } | { success: false; error: string } {
  try {
    const parsed = PlanMessageSchema.parse(data);
    return {
      success: true,
      state: {
        plan: parsed.payload.plan,
        graph: parsed.payload.graph,
        runs: parsed.payload.runs,
        activeRun: parsed.payload.activeRun
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
        error: `Failed to decode plan.state: ${detail}`
      };
    }
    return {
      success: false,
      error: `Failed to decode plan.state: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
