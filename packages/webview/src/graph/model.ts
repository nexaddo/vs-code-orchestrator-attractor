import type { GraphRecord, NodeStatus } from "@attractor/shared";

export interface GraphState {
  runId: string;
  graph: GraphRecord;
  nodeStatuses: NodeStatus[];
}
