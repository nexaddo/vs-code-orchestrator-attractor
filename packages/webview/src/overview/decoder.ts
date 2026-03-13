import { z } from "zod";
import {
  WebviewOutboundMessageSchema,
  RepositoryRecordSchema
} from "@attractor/shared";
import type { OverviewState } from "./model";

const OverviewPayloadSchema = z.object({
  summary: z.object({
    totalRepositories: z.number().int().nonnegative(),
    totalPlans: z.number().int().nonnegative(),
    activeRuns: z.number().int().nonnegative()
  }),
  repositories: z.array(RepositoryRecordSchema)
});

const OverviewMessageSchema = WebviewOutboundMessageSchema.extend({
  type: z.literal("overview.state"),
  payload: OverviewPayloadSchema
});

export function decodeOverviewState(
  data: unknown
): { success: true; state: OverviewState } | { success: false; error: string } {
  try {
    const parsed = OverviewMessageSchema.parse(data);
    return {
      success: true,
      state: {
        summary: parsed.payload.summary,
        repositories: parsed.payload.repositories
      }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Invalid overview.state message: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`
      };
    }
    return {
      success: false,
      error: `Failed to decode overview.state: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
