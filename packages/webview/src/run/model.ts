import type {
  AgentRole,
  AgentRoleStatus,
  PlanRecord,
  RepositoryRecord,
  RunRecord
} from "@attractor/shared";

export interface AgentRolePhaseView {
  role: AgentRole;
  status: AgentRoleStatus;
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
  currentStep: string | null;
  logTail: string[];
  repositories?: RepositoryRecord[];
  orchestration?: OrchestrationState;
}
