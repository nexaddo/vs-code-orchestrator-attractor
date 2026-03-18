import type {
  EventEnvelope,
  GraphRecord,
  RepositoryRecord,
  RunRecord,
  WorktreeLease,
  WorktreeLeaseStatus
} from "@attractor/shared";

import type { DomainEvent } from "../domain/events";

export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
}

// ── Storage ports ────────────────────────────────────────────────────────────

export interface RunRepository {
  save(run: RunRecord): Promise<void>;
  find(runId: string): Promise<RunRecord | undefined>;
  list(): Promise<RunRecord[]>;
}

export interface GraphRepository {
  save(graph: GraphRecord): Promise<void>;
  find(graphId: string): Promise<GraphRecord | undefined>;
}

export interface WorktreeLeaseStore {
  allocate(runId: string, worktreePath: string): Promise<WorktreeLease>;
  updateStatus(runId: string, status: WorktreeLeaseStatus): Promise<void>;
  findByRunId(runId: string): Promise<WorktreeLease | undefined>;
  release(runId: string): Promise<void>;
  listAll(): Promise<WorktreeLease[]>;
}

export interface EventLog {
  append(runId: string, envelope: EventEnvelope): Promise<void>;
  readAll(runId: string): Promise<EventEnvelope[]>;
}

// ── Worktree manager port ────────────────────────────────────────────────────

export interface WorktreeManager {
  allocate(runId: string): Promise<string>; // returns worktree path
  release(worktreePath: string, retain: boolean): Promise<void>;
}

// ── Repository registry port ─────────────────────────────────────────────────

export interface RepositoryRegistry {
  add(repo: RepositoryRecord): Promise<void>;
  remove(repoId: string): Promise<void>;
  list(): Promise<RepositoryRecord[]>;
  find(repoId: string): Promise<RepositoryRecord | undefined>;
}
