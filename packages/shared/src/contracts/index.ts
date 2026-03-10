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

export const PlanRepositorySchema = z.object({
  repositoryId: z.string().min(1),
  role: PlanRepositoryRoleSchema,
  access: PlanRepositoryAccessSchema,
  mountAlias: z.string().min(1)
});

export type PlanRepository = z.infer<typeof PlanRepositorySchema>;

export const PlanStatusSchema = z.enum(["draft", "active", "completed"]);

export const PlanRecordSchema = z
  .object({
    version: z.literal(CONTRACT_VERSION),
    id: z.string().min(1),
    title: z.string().min(1),
    goal: z.string().min(1),
    status: PlanStatusSchema,
    repositories: z.array(PlanRepositorySchema).min(1),
    primaryExecutableRepositoryId: z.string().min(1),
    graphSource: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
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
