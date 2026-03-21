import { type GraphUpdatePayload } from "@attractor/shared";

type NodeStatus =
  | "queued"
  | "running"
  | "blocked"
  | "failed"
  | "succeeded"
  | "canceled";

/**
 * Builds a GraphUpdatePayload for a given node and its status.
 *
 * Pure synchronous builder — no storage access or async logic.
 */
export function buildGraphUpdate(
  nodeId: string,
  status: NodeStatus
): GraphUpdatePayload {
  return { nodeId, status };
}
