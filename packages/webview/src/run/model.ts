import type { PlanRecord, RunRecord } from "@attractor/shared";

export interface RunState {
  run: RunRecord;
  plan: PlanRecord;
  currentStep: string | null;
  logTail: string[];
}
