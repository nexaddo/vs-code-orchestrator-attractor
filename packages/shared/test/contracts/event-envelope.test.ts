import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { EventEnvelopeSchema } from "../../src/contracts";

const fixturesDir = path.resolve(
  __dirname,
  "../../../../test/fixtures/contracts/event-envelopes"
);

const loadFixture = (relativePath: string): unknown => {
  const fullPath = path.join(fixturesDir, relativePath);
  return JSON.parse(readFileSync(fullPath, "utf8")) as unknown;
};

describe("EventEnvelopeSchema", () => {
  it("accepts a minimal valid event fixture", () => {
    const parsed = EventEnvelopeSchema.parse(loadFixture("valid/minimal.json"));

    expect(parsed.version).toBe(1);
    expect(parsed.name).toBe("run.created");
    expect(parsed.aggregateType).toBe("run");
    expect(parsed.aggregateId).toBe("run_001");
    expect(parsed.correlationId).toBe("corr_001");
  });

  it("rejects an event missing required fields", () => {
    const result = EventEnvelopeSchema.safeParse(
      loadFixture("invalid/missing-name.json")
    );

    expect(result.success).toBe(false);
  });

  it("accepts arbitrary payload fields", () => {
    const parsed = EventEnvelopeSchema.parse(
      loadFixture("valid/with-payload.json")
    );

    expect(parsed.payload["planId"]).toBe("plan_001");
  });

  it("survives a JSON round-trip", () => {
    const fixture = loadFixture("valid/minimal.json");
    const parsed = EventEnvelopeSchema.parse(fixture);
    const roundTripped = JSON.parse(JSON.stringify(parsed)) as unknown;

    expect(EventEnvelopeSchema.parse(roundTripped)).toEqual(parsed);
  });
});
