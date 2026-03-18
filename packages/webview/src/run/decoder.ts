import { z } from "zod";
import {
  WebviewOutboundMessageSchema,
  RunStatePayloadSchema
} from "@attractor/shared";
import type { RunState } from "./model";

const RunMessageSchema = WebviewOutboundMessageSchema.extend({
  type: z.literal("run.state"),
  payload: RunStatePayloadSchema
});

export function decodeRunState(
  data: unknown
): { success: true; state: RunState } | { success: false; error: string } {
  try {
    const parsed = RunMessageSchema.parse(data);
    return {
      success: true,
      state: {
        run: parsed.payload.run,
        plan: parsed.payload.plan,
        currentStep: parsed.payload.currentStep,
        logTail: parsed.payload.logTail
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
        error: `Failed to decode run.state: ${detail}`
      };
    }
    return {
      success: false,
      error: `Failed to decode run.state: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
