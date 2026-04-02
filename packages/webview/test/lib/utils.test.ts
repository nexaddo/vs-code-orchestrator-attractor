import { describe, expect, it } from "vitest";

import { formatTimestamp } from "../../src/lib/utils";

describe("formatTimestamp", () => {
  it("returns empty string for undefined", () => {
    expect(formatTimestamp(undefined as unknown as string)).toBe("");
  });

  it("returns empty string for null", () => {
    expect(formatTimestamp(null as unknown as string)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(formatTimestamp("")).toBe("");
  });

  it("returns the original string for an unparseable value", () => {
    expect(formatTimestamp("not-a-date")).toBe("not-a-date");
  });

  it("formats a valid ISO timestamp as HH:MM:SS.mmm", () => {
    // Use a fixed UTC offset-aware string to avoid locale flakiness.
    const result = formatTimestamp("2026-04-02T15:30:45.123Z");
    // Result is local time — just verify it matches HH:MM:SS.mmm pattern.
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
  });
});
