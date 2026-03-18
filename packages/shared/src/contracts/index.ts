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
  "orchestration.state",
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

// ── RunRecord ──────────────────────────────────────────────────────────────

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
  graphId: z.string().min(1),
  worktreeId: z.string().min(1),
  status: RunStatusSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  startedAt: z.string().min(1).optional(),
  completedAt: z.string().min(1).optional()
});

export type RunRecord = z.infer<typeof RunRecordSchema>;

// ── GraphRecord ────────────────────────────────────────────────────────────

export const GraphNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  dependsOn: z.array(z.string())
});

export const GraphRecordSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  id: z.string().min(1),
  planId: z.string().min(1),
  source: z.string().min(1),
  nodes: z.array(GraphNodeSchema).min(1),
  createdAt: z.string().min(1)
});

export type GraphNode = z.infer<typeof GraphNodeSchema>;
export type GraphRecord = z.infer<typeof GraphRecordSchema>;

// ── EventEnvelope ──────────────────────────────────────────────────────────

export const EventEnvelopeSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  id: z.string().min(1),
  name: z.string().min(1),
  aggregateType: z.string().min(1),
  aggregateId: z.string().min(1),
  correlationId: z.string().min(1),
  timestamp: z.string().min(1),
  payload: z.record(z.string(), z.unknown())
});

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

// ── WorktreeLease ───────────────────────────────────────────────────────────

export const WorktreeLeaseStatusSchema = z.enum([
  "allocated",
  "preparing",
  "busy",
  "releasing",
  "retained"
]);

export const WorktreeLeaseSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  runId: z.string().min(1),
  worktreePath: z.string().min(1),
  status: WorktreeLeaseStatusSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
});

export type WorktreeLeaseStatus = z.infer<typeof WorktreeLeaseStatusSchema>;
export type WorktreeLease = z.infer<typeof WorktreeLeaseSchema>;

export const WorktreeLeaseStoreRecordSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  leases: z.array(WorktreeLeaseSchema)
});

export type WorktreeLeaseStoreRecord = z.infer<
  typeof WorktreeLeaseStoreRecordSchema
>;

// ── Typed webview payload schemas ───────────────────────────────────────────

export const RepositoryStatePayloadSchema = z.object({
  repository: RepositoryRecordSchema,
  plans: z.array(PlanRecordSchema)
});

export type RepositoryStatePayload = z.infer<
  typeof RepositoryStatePayloadSchema
>;

export const NodeStatusValueSchema = z.enum([
  "pending",
  "running",
  "done",
  "failed"
]);

export type NodeStatusValue = z.infer<typeof NodeStatusValueSchema>;

export const NodeStatusSchema = z.object({
  nodeId: z.string().min(1),
  status: NodeStatusValueSchema
});

export type NodeStatus = z.infer<typeof NodeStatusSchema>;

export const PlanStatePayloadSchema = z.object({
  plan: PlanRecordSchema,
  graph: GraphRecordSchema.nullable(),
  runs: z.array(RunRecordSchema),
  activeRun: RunRecordSchema.nullable(),
  repositories: z.array(RepositoryRecordSchema).optional()
});

export type PlanStatePayload = z.infer<typeof PlanStatePayloadSchema>;

export const RunStatePayloadSchema = z.object({
  run: RunRecordSchema,
  plan: PlanRecordSchema,
  currentStep: z.string().nullable(),
  logTail: z.array(z.string()),
  repositories: z.array(RepositoryRecordSchema).optional()
});

export type RunStatePayload = z.infer<typeof RunStatePayloadSchema>;

export const TimelineUpdatePayloadSchema = z.object({
  runId: z.string().min(1),
  events: z.array(EventEnvelopeSchema)
});

export type TimelineUpdatePayload = z.infer<typeof TimelineUpdatePayloadSchema>;

export const GraphUpdatePayloadSchema = z.object({
  runId: z.string().min(1),
  graph: GraphRecordSchema,
  nodeStatuses: z.array(NodeStatusSchema)
});

export type GraphUpdatePayload = z.infer<typeof GraphUpdatePayloadSchema>;

// ── Orchestration / Agent Role schemas ─────────────────────────────────────

export const AgentRoleSchema = z.enum([
  "orchestrator",
  "planner",
  "implementer",
  "reviewer"
]);

export type AgentRole = z.infer<typeof AgentRoleSchema>;

export const AgentRoleStatusSchema = z.enum([
  "done",
  "running",
  "waiting",
  "failed",
  "skipped"
]);

export type AgentRoleStatus = z.infer<typeof AgentRoleStatusSchema>;

export const AgentRolePhaseSchema = z.object({
  role: AgentRoleSchema,
  status: AgentRoleStatusSchema,
  taskSummary: z.string().optional(),
  errorLabel: z.string().optional()
});

export type AgentRolePhase = z.infer<typeof AgentRolePhaseSchema>;

export const OrchestrationStatePayloadSchema = z.object({
  runId: z.string().min(1),
  milestoneIndex: z.number().int().min(1),
  milestoneCount: z.number().int().min(1),
  milestoneName: z.string().min(1),
  phases: z.array(AgentRolePhaseSchema).length(4)
});

export type OrchestrationStatePayload = z.infer<
  typeof OrchestrationStatePayloadSchema
>;

// ── Handoff Artifacts ────────────────────────────────────────────────────────

export const OrchestratorHandoffSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  milestoneId: z.string().min(1),
  milestoneName: z.string().min(1),
  description: z.string().min(1),
  acceptanceCriteria: z.array(z.string()).min(1)
});

export type OrchestratorHandoff = z.infer<typeof OrchestratorHandoffSchema>;

export const PlannerTaskSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  testFirst: z.boolean()
});

export const PlannerHandoffSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  milestoneId: z.string().min(1),
  tasks: z.array(PlannerTaskSchema).min(1),
  filesLikelyAffected: z.array(z.string())
});

export type PlannerHandoff = z.infer<typeof PlannerHandoffSchema>;

export const ImplementerHandoffSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  milestoneId: z.string().min(1),
  tasksCompleted: z.array(z.string()),
  summary: z.string().min(1),
  testsPassed: z.boolean()
});

export type ImplementerHandoff = z.infer<typeof ImplementerHandoffSchema>;

export const ReviewerHandoffSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  milestoneId: z.string().min(1),
  approved: z.boolean(),
  comments: z.array(z.string()),
  requiresChanges: z.boolean()
});

export type ReviewerHandoff = z.infer<typeof ReviewerHandoffSchema>;
