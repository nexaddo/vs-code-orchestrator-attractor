import type {
  GraphRecord,
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
  repositories?: RepositoryRecord[];
}
