import { z } from "zod";
import {
  WebviewOutboundMessageSchema,
  GraphUpdatePayloadSchema
} from "@attractor/shared";
import type { GraphState } from "./model";

const GraphMessageSchema = WebviewOutboundMessageSchema.extend({
  type: z.literal("graph.update"),
  payload: GraphUpdatePayloadSchema
});

export function decodeGraphUpdate(
  data: unknown
): { success: true; state: GraphState } | { success: false; error: string } {
  try {
    const parsed = GraphMessageSchema.parse(data);
    return {
      success: true,
      state: {
        runId: parsed.payload.runId,
        graph: parsed.payload.graph,
        nodeStatuses: parsed.payload.nodeStatuses
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
        error: `Failed to decode graph.update: ${detail}`
      };
    }
    return {
      success: false,
      error: `Failed to decode graph.update: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
