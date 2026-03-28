import type {
  ArtifactRecord,
  HandoffEnvelope,
  MilestoneRunRecord,
  PlanRecord,
  RepositoryRecord,
  RunRecord
} from "@attractor/shared";

export interface AgentRolePhaseView {
  role: string;
  status: string;
  taskSummary?: string;
  errorLabel?: string;
}

export interface OrchestrationState {
  runId: string;
  milestoneIndex: number;
  milestoneCount: number;
  milestoneName: string;
  phases: AgentRolePhaseView[];
}

export interface RunState {
  run: RunRecord;
  plan: PlanRecord;
  milestoneRuns: MilestoneRunRecord[];
  artifacts: ArtifactRecord[];
  currentHandoff?: HandoffEnvelope;
  repositories?: RepositoryRecord[];
  orchestration?: OrchestrationState;
  currentStep?: string | null;
  logTail?: string[];
}
