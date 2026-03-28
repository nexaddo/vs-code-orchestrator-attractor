import { z } from "zod";
import {
  WebviewOutboundMessageSchema,
  RepositoryStatePayloadSchema
} from "@attractor/shared";
import type { RepositoryState } from "./model";

const RepositoryMessageSchema = WebviewOutboundMessageSchema.extend({
  type: z.literal("repository.state"),
  payload: RepositoryStatePayloadSchema
});

export function decodeRepositoryState(
  data: unknown
):
  | { success: true; state: RepositoryState }
  | { success: false; error: string } {
  try {
    const parsed = RepositoryMessageSchema.parse(data);
    return {
      success: true,
      state: {
        repository: parsed.payload.repository,
        plans: parsed.payload.plans,
        runs: parsed.payload.runs,
        activity: parsed.payload.activity
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
        error: `Failed to decode repository.state: ${detail}`
      };
    }
    return {
      success: false,
      error: `Failed to decode repository.state: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
