import type { PlanRecord, RepositoryRecord } from "@attractor/shared";

export interface RepositoryState {
  repository: RepositoryRecord;
  plans: PlanRecord[];
}
