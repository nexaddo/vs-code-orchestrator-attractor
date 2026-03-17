import { z } from "zod";

export const CONTRACT_VERSION = 1 as const;

export const RepositoryRecordSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  id: z.string().min(1),
  name: z.string().min(1),
  rootUri: z.string().min(1),
  remoteUrl: z.string().min(1).optional(),
  defaultBranch: z.string().min(1),
  labels: z.array(z.string())
});

export type RepositoryRecord = z.infer<typeof RepositoryRecordSchema>;

export const WebviewInboundMessageTypeSchema = z.enum([
  "repository.open",
  "plan.create",
  "plan.run",
  "run.resume",
  "run.cancel",
  "run.retry",
  "milestone.open",
  "graph.focus"
]);

export const WebviewInboundMessageSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  requestId: z.string().min(1),
  type: WebviewInboundMessageTypeSchema,
  payload: z.record(z.string(), z.unknown())
});

export type WebviewInboundMessage = z.infer<typeof WebviewInboundMessageSchema>;

export const WebviewOutboundMessageTypeSchema = z.enum([
  "overview.state",
  "repository.state",
  "plan.state",
  "run.state",
  "timeline.update",
  "graph.update",
  "toast"
]);

export const WebviewOutboundMessageSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  requestId: z.string().min(1),
  type: WebviewOutboundMessageTypeSchema,
  payload: z.record(z.string(), z.unknown())
});

export type WebviewOutboundMessage = z.infer<
  typeof WebviewOutboundMessageSchema
>;

export const PlanRepositoryRoleSchema = z.enum(["executable", "context"]);

export const PlanRepositoryAccessSchema = z.enum(["read_write", "read_only"]);

export const PlanRepositoryRefSchema = z.object({
  repositoryId: z.string().min(1),
  role: PlanRepositoryRoleSchema,
  access: PlanRepositoryAccessSchema,
  mountAlias: z.string().min(1),
  ref: z.string().min(1).optional()
});

export type PlanRepositoryRef = z.infer<typeof PlanRepositoryRefSchema>;

export const PlanStatusSchema = z.enum([
  "draft",
  "ready",
  "queued",
  "running",
  "paused",
  "completed",
  "failed",
  "canceled"
]);

export const PlanRecordSchema = z
  .object({
    version: z.literal(CONTRACT_VERSION),
    id: z.string().min(1),
    title: z.string().min(1),
    goal: z.string().min(1),
    status: PlanStatusSchema,
    repositories: z.array(PlanRepositoryRefSchema).min(1),
    primaryExecutableRepositoryId: z.string().min(1),
    graphSource: z.string().min(1),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1)
  })
  .refine(
    (plan) => {
      const writableRepos = plan.repositories.filter(
        (r) => r.access === "read_write"
      );
      return writableRepos.length === 1;
    },
    { message: "Plan must have exactly one writable repository" }
  )
  .refine(
    (plan) => {
      const primaryRepo = plan.repositories.find(
        (r) => r.repositoryId === plan.primaryExecutableRepositoryId
      );
      return primaryRepo && primaryRepo.access === "read_write";
    },
    { message: "Primary executable repository must be writable" }
  )
  .refine(
    (plan) => {
      const primaryRepo = plan.repositories.find(
        (r) => r.repositoryId === plan.primaryExecutableRepositoryId
      );
      return primaryRepo && primaryRepo.role === "executable";
    },
    { message: "Primary executable repository must have executable role" }
  )
  .refine(
    (plan) => {
      const executableRepos = plan.repositories.filter(
        (r) => r.role === "executable"
      );
      return executableRepos.length === 1;
    },
    { message: "Plan must have exactly one executable repository" }
  )
  .refine(
    (plan) => {
      const ids = plan.repositories.map((r) => r.repositoryId);
      return new Set(ids).size === ids.length;
    },
    { message: "Repository IDs must be unique" }
  )
  .refine(
    (plan) => {
      return plan.repositories.some(
        (r) => r.repositoryId === plan.primaryExecutableRepositoryId
      );
    },
    { message: "Primary executable repository must exist in repositories" }
  );

export type PlanRecord = z.infer<typeof PlanRecordSchema>;

export const RunStatusSchema = z.enum([
  "queued",
  "running",
  "paused",
  "completed",
  "failed",
  "canceled"
]);

export const RunRecordSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  id: z.string().min(1),
  planId: z.string().min(1),
  status: RunStatusSchema,
  attempt: z.number().int().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
});

export type RunRecord = z.infer<typeof RunRecordSchema>;

// ── M2 schemas ────────────────────────────────────────────────────────────────

export const ExtensionEventEntityTypeSchema = z.enum([
  "repository",
  "plan",
  "milestone",
  "run",
  "handoff",
  "artifact",
  "worktree"
]);

export const ExtensionEventKindSchema = z.enum([
  "created",
  "updated",
  "status.changed",
  "checkpoint.saved",
  "checkpoint.restored",
  "handoff.created",
  "artifact.created",
  "validation.failed",
  "error"
]);

export const ExtensionEventSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  id: z.string().min(1),
  requestId: z.string().min(1).optional(),
  runId: z.string().min(1).optional(),
  entityType: ExtensionEventEntityTypeSchema,
  entityId: z.string().min(1),
  kind: ExtensionEventKindSchema,
  timestamp: z.string().min(1),
  payload: z.record(z.string(), z.unknown())
});

export type ExtensionEvent = z.infer<typeof ExtensionEventSchema>;

export const WorktreeLeaseStateSchema = z.enum([
  "active",
  "released",
  "orphaned"
]);

export const WorktreeLeaseSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  id: z.string().min(1),
  runId: z.string().min(1),
  repositoryId: z.string().min(1),
  branchName: z.string().min(1),
  worktreePath: z.string().min(1),
  state: WorktreeLeaseStateSchema,
  headCommit: z.string().min(1).optional(),
  createdAt: z.string().min(1),
  releasedAt: z.string().min(1).optional()
});

export type WorktreeLease = z.infer<typeof WorktreeLeaseSchema>;

export const MilestoneStatusSchema = z.enum([
  "pending",
  "ready",
  "running",
  "paused",
  "completed",
  "failed",
  "canceled",
  "blocked"
]);

export const MilestoneRecordSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  id: z.string().min(1),
  planId: z.string().min(1),
  title: z.string().min(1),
  order: z.number().int().min(0),
  status: MilestoneStatusSchema,
  acceptanceCriteria: z.array(z.string()),
  nodeIds: z.array(z.string())
});

export type MilestoneRecord = z.infer<typeof MilestoneRecordSchema>;

export const RunSnapshotSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  runId: z.string().min(1),
  status: RunStatusSchema,
  currentMilestoneId: z.string().min(1).nullable(),
  lastCheckpointId: z.string().min(1).nullable(),
  snapshotAt: z.string().min(1)
});

export type RunSnapshot = z.infer<typeof RunSnapshotSchema>;
