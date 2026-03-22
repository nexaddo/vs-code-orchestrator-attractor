import type {
  ExtensionEvent,
  PlanRecord,
  RepositoryRecord,
  RunRecord
} from "@attractor/shared";

export interface RepositoryState {
  repository: RepositoryRecord;
  plans: PlanRecord[];
  runs: RunRecord[];
  activity: ExtensionEvent[];
}
