import type { GraphRecord, PlanRecord, RunRecord } from "@attractor/shared";

export interface PlanState {
  plan: PlanRecord;
  graph: GraphRecord | null;
  runs: RunRecord[];
  activeRun: RunRecord | null;
}
