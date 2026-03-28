import type {
  PlanRecord,
  RepositoryRecord,
  RunRecord
} from "@attractor/shared";

export interface RunState {
  run: RunRecord;
  plan: PlanRecord;
  currentStep: string | null;
  logTail: string[];
  repositories?: RepositoryRecord[];
}
