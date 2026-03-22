import { z } from "zod";
import {
  WebviewOutboundMessageSchema,
  OverviewStatePayloadSchema
} from "@attractor/shared";
import type { OverviewState } from "./model";

const OverviewMessageSchema = WebviewOutboundMessageSchema.extend({
  type: z.literal("overview.state"),
  payload: OverviewStatePayloadSchema
});

export function decodeOverviewState(
  data: unknown
): { success: true; state: OverviewState } | { success: false; error: string } {
  try {
    const parsed = OverviewMessageSchema.parse(data);
    return {
      success: true,
      state: {
        repositories: parsed.payload.repositories,
        activeRuns: parsed.payload.activeRuns,
        recentFailures: parsed.payload.recentFailures,
        stats: parsed.payload.stats
      }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Failed to decode overview.state: ${error.errors
          .map((e) => {
            const location = e.path.length > 0 ? e.path.join(".") : "(root)";
            return `${location}: ${e.message}`;
          })
          .join(", ")}`
      };
    }
    return {
      success: false,
      error: `Failed to decode overview.state: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
