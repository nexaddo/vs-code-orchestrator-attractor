import type {
  EventEnvelope,
  GraphRecord,
  RepositoryRecord,
  RunRecord,
  RunRecoverySnapshot,
  WorktreeLease
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
  findByRunId(runId: string): Promise<WorktreeLease | undefined>;
  listAll(): Promise<WorktreeLease[]>;
  release(runId: string): Promise<void>;
}

export interface EventLog {
  append(runId: string, envelope: EventEnvelope): Promise<void>;
  readAll(runId: string): Promise<EventEnvelope[]>;
}

export interface RunSnapshotStore {
  save(snapshot: RunRecoverySnapshot): Promise<void>;
  find(runId: string): Promise<RunRecoverySnapshot | undefined>;
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

// ── ModelGateway port ────────────────────────────────────────────────────────

/**
 * Represents a message sent to or received from a language model.
 */
export interface ModelMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Options for configuring a model request.
 */
export interface ModelRequestOptions {
  modelFamily?: string;
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}

/**
 * Abstract gateway for language model interactions.
 * Implementations may target VS Code Copilot, OpenAI, or test stubs.
 */
export interface ModelGateway {
  send(
    messages: ModelMessage[],
    options?: ModelRequestOptions
  ): Promise<string>;

  stream(
    messages: ModelMessage[],
    onChunk: (text: string) => void,
    options?: ModelRequestOptions
  ): Promise<void>;
}

/**
 * A no-op gateway that returns empty responses.
 * Used as the default when no real model provider is configured.
 */
export class NoOpModelGateway implements ModelGateway {
  async send(
    messages: ModelMessage[],
    options?: ModelRequestOptions
  ): Promise<string> {
    void messages;
    void options;
    return "";
  }

  async stream(
    messages: ModelMessage[],
    onChunk: (text: string) => void,
    options?: ModelRequestOptions
  ): Promise<void> {
    void messages;
    void onChunk;
    void options;
    return;
  }
}
