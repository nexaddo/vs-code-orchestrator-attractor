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
  // Strategy 1: Extract from fenced code blocks (```json ... ``` or ``` ... ```)
  const fenceMatch = /```(?:json)?\s*\n?([\s\S]*?)```/.exec(rawText);
  if (fenceMatch && fenceMatch[1]) {
    const trimmed = fenceMatch[1].trim();
    if (trimmed.startsWith("{")) {
      try {
        return JSON.parse(trimmed);
      } catch {
        // fall through
      }
    }
  }

  // Strategy 2: Balanced brace scanning from `{` candidates
  const firstBrace = rawText.indexOf("{");
  if (firstBrace !== -1) {
    for (let start = firstBrace; start < rawText.length; start++) {
      if (rawText[start] !== "{") {
        continue;
      }

      let depth = 0;
      let inString = false;
      let escape = false;

      for (let i = start; i < rawText.length; i++) {
        const ch = rawText[i];
        if (escape) {
          escape = false;
          continue;
        }
        if (ch === "\\") {
          escape = true;
          continue;
        }
        if (ch === '"') {
          inString = !inString;
          continue;
        }
        if (inString) {
          continue;
        }
        if (ch === "{") {
          depth++;
        }
        if (ch === "}") {
          depth--;
          if (depth === 0) {
            try {
              return JSON.parse(rawText.slice(start, i + 1));
            } catch {
              break;
            }
          }
        }
      }
    }
  }

  // Strategy 3: Greedy regex fallback
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
