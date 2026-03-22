import {
  CONTRACT_VERSION,
  OrchestratorHandoffSchema,
  PlannerHandoffSchema,
  ImplementerHandoffSchema,
  ReviewerHandoffSchema,
  type OrchestratorHandoff,
  type PlannerHandoff,
  type ImplementerHandoff,
  type ReviewerHandoff,
  type ArtifactRecord
} from "@attractor/shared";

type Role = "orchestrator" | "planner" | "implementer" | "reviewer";

/**
 * Extracts JSON from model text response using regex.
 * @param rawText - Raw model response text
 * @returns Parsed JSON object
 * @throws Error if no JSON found or JSON is invalid
 */
export function parseHandoffResponse(rawText: string): unknown {
  const match = /\{[\s\S]*\}/.exec(rawText);
  if (!match) {
    throw new Error("No JSON found in model response");
  }

  try {
    return JSON.parse(match[0]);
  } catch (error) {
    throw new Error(
      `Invalid JSON in model response: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Constructs a valid OrchestratorHandoff object.
 * @param milestoneId - Milestone identifier
 * @param milestoneName - Milestone name
 * @param description - Milestone description
 * @param acceptanceCriteria - Acceptance criteria list
 * @returns Validated OrchestratorHandoff
 */
export function buildOrchestratorHandoff(
  milestoneId: string,
  milestoneName: string,
  description: string,
  acceptanceCriteria: string[]
): OrchestratorHandoff {
  const handoff = {
    version: CONTRACT_VERSION,
    milestoneId,
    milestoneName,
    description,
    acceptanceCriteria
  };

  return OrchestratorHandoffSchema.parse(handoff);
}

/**
 * Builds a PlannerHandoff from raw model response.
 * @param rawModelResponse - Raw model text response
 * @param milestoneId - Milestone identifier
 * @returns Validated PlannerHandoff
 */
export function buildPlannerHandoff(
  rawModelResponse: string,
  milestoneId: string
): PlannerHandoff {
  const parsed = parseHandoffResponse(rawModelResponse);

  const handoff = {
    ...(parsed as object),
    milestoneId,
    version: CONTRACT_VERSION
  };

  return PlannerHandoffSchema.parse(handoff);
}

/**
 * Builds an ImplementerHandoff from raw model response.
 * @param rawModelResponse - Raw model text response
 * @param milestoneId - Milestone identifier
 * @returns Validated ImplementerHandoff
 */
export function buildImplementerHandoff(
  rawModelResponse: string,
  milestoneId: string
): ImplementerHandoff {
  const parsed = parseHandoffResponse(rawModelResponse);

  const handoff = {
    ...(parsed as object),
    milestoneId,
    version: CONTRACT_VERSION
  };

  return ImplementerHandoffSchema.parse(handoff);
}

/**
 * Builds a ReviewerHandoff from raw model response.
 * @param rawModelResponse - Raw model text response
 * @param milestoneId - Milestone identifier
 * @returns Validated ReviewerHandoff
 */
export function buildReviewerHandoff(
  rawModelResponse: string,
  milestoneId: string
): ReviewerHandoff {
  const parsed = parseHandoffResponse(rawModelResponse);

  const handoff = {
    ...(parsed as object),
    milestoneId,
    version: CONTRACT_VERSION
  };

  return ReviewerHandoffSchema.parse(handoff);
}

/**
 * Maps a handoff payload to an ArtifactRecord write intent.
 * @param handoff - Any handoff payload
 * @param role - Role that created the handoff
 * @param runId - Run identifier
 * @param nodeId - Optional node identifier
 * @returns ArtifactRecord write intent (without id and createdAt)
 */
export function handoffToArtifactWriteIntent(
  handoff:
    | OrchestratorHandoff
    | PlannerHandoff
    | ImplementerHandoff
    | ReviewerHandoff,
  role: Role,
  runId: string,
  nodeId?: string
): Omit<ArtifactRecord, "id" | "createdAt"> {
  return {
    version: CONTRACT_VERSION,
    type: "handoff",
    title: `${role} handoff for ${handoff.milestoneId}`,
    uri: `attractor://handoffs/${runId}/${role}/${handoff.milestoneId}`,
    runId,
    nodeId,
    milestoneId: handoff.milestoneId
  };
}
