import type {
  ArtifactRecord,
  HandoffEnvelope,
  MilestoneRunRecord,
  PlanRecord,
  RunRecord
} from "@attractor/shared";

export interface RunState {
  run: RunRecord;
  plan: PlanRecord;
  milestoneRuns: MilestoneRunRecord[];
  artifacts: ArtifactRecord[];
  currentHandoff?: HandoffEnvelope;
}
