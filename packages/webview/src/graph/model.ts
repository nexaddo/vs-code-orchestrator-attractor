import type { GraphRecord, NodeStatusEntry } from "@attractor/shared";

export interface GraphState {
  runId: string;
  graph: GraphRecord;
  nodeStatuses: NodeStatusEntry[];
}
