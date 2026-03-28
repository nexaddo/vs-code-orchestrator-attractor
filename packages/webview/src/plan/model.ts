import type {
  ExtensionEvent,
  MilestoneRecord,
  PlanRecord,
  RunRecord
} from "@attractor/shared";

export interface PlanState {
  plan: PlanRecord;
  milestones: MilestoneRecord[];
  history: RunRecord[];
  validationEvents: ExtensionEvent[];
}
