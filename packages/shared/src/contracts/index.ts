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
  "ready",
  "repository.open",
  "plan.open",
  "plan.create",
  "plan.run",
  "run.open",
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
  "toast",
  "orchestration.state"
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
  name: z.string().min(1).optional(),
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
      return plan.repositories.some(
        (r) => r.repositoryId === plan.primaryExecutableRepositoryId
      );
    },
    { message: "Primary executable repository must exist in repositories" }
  )
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
  updatedAt: z.string().min(1),
  graphId: z.string().min(1).optional(),
  worktreeId: z.string().min(1).optional(),
  startedAt: z.string().min(1).optional(),
  completedAt: z.string().min(1).optional()
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

// ── M3.6 schemas ──────────────────────────────────────────────────────────────

export const NodeStatusSchema = z.enum([
  "queued",
  "running",
  "blocked",
  "failed",
  "succeeded",
  "canceled"
]);

export const MilestoneRunRecordSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  id: z.string().min(1),
  runId: z.string().min(1),
  milestoneId: z.string().min(1),
  nodeId: z.string().min(1),
  status: NodeStatusSchema,
  startedAt: z.string().min(1),
  endedAt: z.string().min(1).optional(),
  errorMessage: z.string().optional()
});

export type MilestoneRunRecord = z.infer<typeof MilestoneRunRecordSchema>;

export const ArtifactTypeSchema = z.enum([
  "task-pack",
  "handoff",
  "log",
  "patch",
  "report",
  "other"
]);

export const ArtifactRecordSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  id: z.string().min(1),
  runId: z.string().min(1),
  nodeId: z.string().min(1).optional(),
  milestoneId: z.string().min(1).optional(),
  type: ArtifactTypeSchema,
  title: z.string().min(1),
  uri: z.string().min(1),
  createdAt: z.string().min(1)
});

export type ArtifactRecord = z.infer<typeof ArtifactRecordSchema>;

export const RoleSchema = z.enum([
  "orchestrator",
  "planner",
  "implementer",
  "reviewer"
]);

export const HandoffEnvelopeSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  id: z.string().min(1),
  runId: z.string().min(1),
  nodeId: z.string().min(1),
  fromRole: RoleSchema,
  toRole: RoleSchema,
  task: z.string().min(1),
  reason: z.string().min(1),
  context: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().min(1)
});

export type HandoffEnvelope = z.infer<typeof HandoffEnvelopeSchema>;

// ── Typed outbound payload schemas ────────────────────────────────────────────

export const WorkspaceSummaryStatsSchema = z.object({
  totalRepos: z.number().int().min(0),
  totalPlans: z.number().int().min(0),
  activeRuns: z.number().int().min(0),
  pausedRuns: z.number().int().min(0),
  failedRuns24h: z.number().int().min(0)
});

export type WorkspaceSummaryStats = z.infer<typeof WorkspaceSummaryStatsSchema>;

export const OverviewStatePayloadSchema = z.object({
  repositories: z.array(RepositoryRecordSchema),
  activeRuns: z.array(RunRecordSchema),
  recentFailures: z.array(RunRecordSchema),
  stats: WorkspaceSummaryStatsSchema,
  error: z.string().optional()
});

export type OverviewStatePayload = z.infer<typeof OverviewStatePayloadSchema>;

export const RepositoryStatePayloadSchema = z.object({
  repository: RepositoryRecordSchema,
  plans: z.array(PlanRecordSchema),
  runs: z.array(RunRecordSchema),
  activity: z.array(ExtensionEventSchema)
});

export type RepositoryStatePayload = z.infer<
  typeof RepositoryStatePayloadSchema
>;

export const PlanStatePayloadSchema = z.object({
  plan: PlanRecordSchema,
  milestones: z.array(MilestoneRecordSchema),
  history: z.array(RunRecordSchema),
  validationEvents: z.array(ExtensionEventSchema)
});

export type PlanStatePayload = z.infer<typeof PlanStatePayloadSchema>;

export const RunStatePayloadSchema = z.object({
  run: RunRecordSchema,
  plan: PlanRecordSchema,
  milestoneRuns: z.array(MilestoneRunRecordSchema),
  artifacts: z.array(ArtifactRecordSchema),
  currentHandoff: HandoffEnvelopeSchema.optional()
});

export type RunStatePayload = z.infer<typeof RunStatePayloadSchema>;

export const GraphUpdatePayloadSchema = z.object({
  nodeId: z.string().min(1),
  status: NodeStatusSchema
});

export type GraphUpdatePayload = z.infer<typeof GraphUpdatePayloadSchema>;

export const ToastPayloadSchema = z.object({
  message: z.string().min(1),
  severity: z.enum(["info", "warning", "error"]),
  actions: z.array(z.string())
});

export type ToastPayload = z.infer<typeof ToastPayloadSchema>;

// ── M4 orchestration schemas ──────────────────────────────────────────────────

export const AgentRoleStatusSchema = z.enum([
  "done",
  "running",
  "waiting",
  "failed",
  "skipped"
]);

export type AgentRoleStatus = z.infer<typeof AgentRoleStatusSchema>;

export const AgentRolePhaseSchema = z.object({
  role: RoleSchema,
  status: AgentRoleStatusSchema,
  taskSummary: z.string().optional(),
  errorLabel: z.string().optional()
});

export type AgentRolePhase = z.infer<typeof AgentRolePhaseSchema>;

export const OrchestrationStatePayloadSchema = z.object({
  runId: z.string().min(1),
  milestoneIndex: z.number().int().min(0),
  milestoneCount: z.number().int().min(1),
  milestoneName: z.string().min(1),
  phases: z.tuple([
    AgentRolePhaseSchema.extend({ role: z.literal("orchestrator") }),
    AgentRolePhaseSchema.extend({ role: z.literal("planner") }),
    AgentRolePhaseSchema.extend({ role: z.literal("implementer") }),
    AgentRolePhaseSchema.extend({ role: z.literal("reviewer") })
  ])
});

export type OrchestrationStatePayload = z.infer<
  typeof OrchestrationStatePayloadSchema
>;

export const OrchestratorHandoffSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  milestoneId: z.string().min(1),
  milestoneName: z.string().min(1),
  description: z.string().min(1),
  acceptanceCriteria: z.array(z.string())
});

export type OrchestratorHandoff = z.infer<typeof OrchestratorHandoffSchema>;

export const PlannerHandoffSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  milestoneId: z.string().min(1),
  tasks: z.array(
    z.object({
      id: z.string().min(1),
      description: z.string().min(1),
      testFirst: z.boolean()
    })
  ),
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

export const ReviewerHandoffSchema = z
  .object({
    version: z.literal(CONTRACT_VERSION),
    milestoneId: z.string().min(1),
    approved: z.boolean(),
    comments: z.array(z.string()),
    requiresChanges: z.boolean()
  })
  .refine((h) => !(h.approved === true && h.requiresChanges === true), {
    message: "Reviewer cannot approve and require changes simultaneously"
  });

export type ReviewerHandoff = z.infer<typeof ReviewerHandoffSchema>;
