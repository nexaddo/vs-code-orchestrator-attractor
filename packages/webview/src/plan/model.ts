import type {
  ExtensionEvent,
  GraphRecord,
  MilestoneRecord,
  PlanRecord,
  RepositoryRecord,
  RunRecord
} from "@attractor/shared";

export interface PlanRepositoryPickerState {
  availableRepositories: RepositoryRecord[];
  selectedExecutableId: string | null;
  selectedContextIds: string[];
  contextAliases: Record<string, string>;
}

export interface PlanState {
  plan: PlanRecord;
  graph: GraphRecord | null;
  runs: RunRecord[];
  activeRun: RunRecord | null;
  milestones: MilestoneRecord[];
  history: RunRecord[];
  validationEvents: ExtensionEvent[];
  repositories?: RepositoryRecord[];
}
