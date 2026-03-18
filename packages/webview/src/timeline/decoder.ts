import { z } from "zod";
import {
  WebviewOutboundMessageSchema,
  TimelineUpdatePayloadSchema
} from "@attractor/shared";
import type { TimelineState } from "./model";

const TimelineMessageSchema = WebviewOutboundMessageSchema.extend({
  type: z.literal("timeline.update"),
  payload: TimelineUpdatePayloadSchema
});

export function decodeTimelineUpdate(
  data: unknown
): { success: true; state: TimelineState } | { success: false; error: string } {
  try {
    const parsed = TimelineMessageSchema.parse(data);
    return {
      success: true,
      state: {
        runId: parsed.payload.runId,
        events: parsed.payload.events
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
        error: `Failed to decode timeline.update: ${detail}`
      };
    }
    return {
      success: false,
      error: `Failed to decode timeline.update: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
