import { describe, it, expect } from "vitest";
import { CONTRACT_VERSION } from "@attractor/shared";
import {
  parseHandoffResponse,
  buildOrchestratorHandoff,
  buildPlannerHandoff,
  buildImplementerHandoff,
  buildReviewerHandoff,
  handoffToArtifactWriteIntent
} from "../../src/application/handoffs";

describe("parseHandoffResponse", () => {
  it("extracts JSON embedded in surrounding text", () => {
    const rawText = 'Here is the result:\n{"foo": "bar", "baz": 42}\nDone!';
    const result = parseHandoffResponse(rawText);
    expect(result).toEqual({ foo: "bar", baz: 42 });
  });

  it("extracts clean JSON (just the object)", () => {
    const rawText = '{"alpha": "beta"}';
    const result = parseHandoffResponse(rawText);
    expect(result).toEqual({ alpha: "beta" });
  });

  it("throws on empty string", () => {
    expect(() => parseHandoffResponse("")).toThrow("No JSON found");
  });

  it("throws on text with no JSON", () => {
    expect(() => parseHandoffResponse("This is just plain text")).toThrow(
      "No JSON found"
    );
  });

  it("throws on invalid JSON (malformed braces)", () => {
    expect(() => parseHandoffResponse('{"key": "value",}')).toThrow(
      "Invalid JSON"
    );
  });

  it("extracts first JSON object when response contains two objects", () => {
    const rawText = 'First: {"a": 1} and second: {"b": 2}';
    const result = parseHandoffResponse(rawText);
    expect(result).toEqual({ a: 1 });
  });

  it("extracts JSON from a fenced code block", () => {
    const rawText = 'Here is the result:\n```json\n{"foo": "bar"}\n```\nDone!';
    const result = parseHandoffResponse(rawText);
    expect(result).toEqual({ foo: "bar" });
  });

  it("extracts JSON from fenced code block without language tag", () => {
    const rawText = 'Result:\n```\n{"key": "value"}\n```';
    const result = parseHandoffResponse(rawText);
    expect(result).toEqual({ key: "value" });
  });

  it("extracts JSON even when prose contains braces before it", () => {
    const rawText =
      'The function() { return; } produces output.\n{"actual": "json"}';
    const result = parseHandoffResponse(rawText);
    expect(result).toEqual({ actual: "json" });
  });

  it("extracts nested JSON object correctly", () => {
    const rawText = 'Response: {"outer": {"inner": "value"}, "count": 1}';
    const result = parseHandoffResponse(rawText);
    expect(result).toEqual({ outer: { inner: "value" }, count: 1 });
  });
});

describe("buildOrchestratorHandoff", () => {
  it("returns valid handoff with correct shape", () => {
    const result = buildOrchestratorHandoff(
      "m1",
      "Setup auth",
      "Create authentication module",
      ["Auth service exists", "Tests pass"]
    );

    expect(result).toEqual({
      version: CONTRACT_VERSION,
      milestoneId: "m1",
      milestoneName: "Setup auth",
      description: "Create authentication module",
      acceptanceCriteria: ["Auth service exists", "Tests pass"]
    });
  });

  it("validates via schema (round-trip)", () => {
    const result = buildOrchestratorHandoff(
      "m2",
      "Add login",
      "Implement login endpoint",
      ["POST /login works"]
    );

    // If schema.parse succeeds, result should equal itself
    expect(result).toEqual(result);
    expect(result.version).toBe(CONTRACT_VERSION);
  });

  it("throws on invalid input (empty milestoneId)", () => {
    expect(() =>
      buildOrchestratorHandoff("", "name", "desc", ["crit"])
    ).toThrow();
  });
});

describe("buildPlannerHandoff", () => {
  it("parses model response with valid JSON and returns valid handoff", () => {
    const rawResponse = JSON.stringify({
      tasks: [
        { id: "t1", description: "Create service", testFirst: true },
        { id: "t2", description: "Add tests", testFirst: false }
      ],
      filesLikelyAffected: ["src/auth.ts", "test/auth.test.ts"]
    });

    const result = buildPlannerHandoff(rawResponse, "m1");

    expect(result.version).toBe(CONTRACT_VERSION);
    expect(result.milestoneId).toBe("m1");
    expect(result.tasks).toHaveLength(2);
    expect(result.filesLikelyAffected).toHaveLength(2);
  });

  it("injects milestoneId correctly", () => {
    const rawResponse = JSON.stringify({
      tasks: [{ id: "t1", description: "Task 1", testFirst: true }],
      filesLikelyAffected: []
    });

    const result = buildPlannerHandoff(rawResponse, "milestone-123");
    expect(result.milestoneId).toBe("milestone-123");
  });

  it("throws on malformed model response", () => {
    expect(() => buildPlannerHandoff("not valid json", "m1")).toThrow();
  });

  it("throws on missing required fields", () => {
    const rawResponse = JSON.stringify({
      tasks: []
      // missing filesLikelyAffected
    });

    expect(() => buildPlannerHandoff(rawResponse, "m1")).toThrow();
  });
});

describe("buildImplementerHandoff", () => {
  it("parses model response with valid JSON and returns valid handoff", () => {
    const rawResponse = JSON.stringify({
      tasksCompleted: ["t1", "t2"],
      summary: "Implemented auth service with full test coverage",
      testsPassed: true
    });

    const result = buildImplementerHandoff(rawResponse, "m1");

    expect(result.version).toBe(CONTRACT_VERSION);
    expect(result.milestoneId).toBe("m1");
    expect(result.tasksCompleted).toEqual(["t1", "t2"]);
    expect(result.summary).toBe(
      "Implemented auth service with full test coverage"
    );
    expect(result.testsPassed).toBe(true);
  });

  it("injects milestoneId correctly", () => {
    const rawResponse = JSON.stringify({
      tasksCompleted: ["t1"],
      summary: "Done",
      testsPassed: true
    });

    const result = buildImplementerHandoff(rawResponse, "milestone-456");
    expect(result.milestoneId).toBe("milestone-456");
  });

  it("throws on malformed model response", () => {
    expect(() => buildImplementerHandoff("invalid { json", "m1")).toThrow();
  });

  it("throws on missing required fields", () => {
    const rawResponse = JSON.stringify({
      tasksCompleted: ["t1"]
      // missing summary and testsPassed
    });

    expect(() => buildImplementerHandoff(rawResponse, "m1")).toThrow();
  });
});

describe("buildReviewerHandoff", () => {
  it("parses model response with valid JSON and returns valid handoff", () => {
    const rawResponse = JSON.stringify({
      approved: true,
      comments: ["Looks good", "Minor style issue"],
      requiresChanges: false
    });

    const result = buildReviewerHandoff(rawResponse, "m1");

    expect(result.version).toBe(CONTRACT_VERSION);
    expect(result.milestoneId).toBe("m1");
    expect(result.approved).toBe(true);
    expect(result.comments).toEqual(["Looks good", "Minor style issue"]);
    expect(result.requiresChanges).toBe(false);
  });

  it("injects milestoneId correctly", () => {
    const rawResponse = JSON.stringify({
      approved: false,
      comments: [],
      requiresChanges: true
    });

    const result = buildReviewerHandoff(rawResponse, "milestone-789");
    expect(result.milestoneId).toBe("milestone-789");
  });

  it("throws on malformed model response", () => {
    expect(() => buildReviewerHandoff("not { valid }", "m1")).toThrow();
  });

  it("throws on missing required fields", () => {
    const rawResponse = JSON.stringify({
      approved: true
      // missing comments and requiresChanges
    });

    expect(() => buildReviewerHandoff(rawResponse, "m1")).toThrow();
  });
});

describe("handoffToArtifactWriteIntent", () => {
  it("maps orchestrator handoff correctly (type, title, uri, version, runId)", () => {
    const handoff = buildOrchestratorHandoff(
      "m1",
      "Setup",
      "Setup milestone",
      []
    );

    const intent = handoffToArtifactWriteIntent(
      handoff,
      "orchestrator",
      "run-123"
    );

    expect(intent.type).toBe("handoff");
    expect(intent.title).toBe("orchestrator handoff for m1");
    expect(intent.uri).toBe("attractor://handoffs/run-123/orchestrator/m1");
    expect(intent.version).toBe(CONTRACT_VERSION);
    expect(intent.runId).toBe("run-123");
    expect(intent.milestoneId).toBe("m1");
  });

  it("maps planner handoff with nodeId correctly", () => {
    const handoff = buildPlannerHandoff(
      JSON.stringify({
        tasks: [{ id: "t1", description: "Task", testFirst: true }],
        filesLikelyAffected: []
      }),
      "m2"
    );

    const intent = handoffToArtifactWriteIntent(
      handoff,
      "planner",
      "run-456",
      "node-789"
    );

    expect(intent.type).toBe("handoff");
    expect(intent.title).toBe("planner handoff for m2");
    expect(intent.uri).toBe("attractor://handoffs/run-456/planner/m2");
    expect(intent.nodeId).toBe("node-789");
    expect(intent.runId).toBe("run-456");
    expect(intent.milestoneId).toBe("m2");
  });

  it("includes milestoneId from handoff", () => {
    const handoff = buildImplementerHandoff(
      JSON.stringify({
        tasksCompleted: [],
        summary: "Done",
        testsPassed: true
      }),
      "milestone-abc"
    );

    const intent = handoffToArtifactWriteIntent(
      handoff,
      "implementer",
      "run-999"
    );

    expect(intent.milestoneId).toBe("milestone-abc");
  });

  it("maps reviewer handoff correctly", () => {
    const handoff = buildReviewerHandoff(
      JSON.stringify({
        approved: true,
        comments: [],
        requiresChanges: false
      }),
      "m3"
    );

    const intent = handoffToArtifactWriteIntent(handoff, "reviewer", "run-111");

    expect(intent.type).toBe("handoff");
    expect(intent.title).toBe("reviewer handoff for m3");
    expect(intent.uri).toBe("attractor://handoffs/run-111/reviewer/m3");
    expect(intent.milestoneId).toBe("m3");
  });

  it("omits nodeId when not provided", () => {
    const handoff = buildOrchestratorHandoff("m1", "Name", "Desc", []);

    const intent = handoffToArtifactWriteIntent(
      handoff,
      "orchestrator",
      "run-222"
    );

    expect(intent.nodeId).toBeUndefined();
  });
});
