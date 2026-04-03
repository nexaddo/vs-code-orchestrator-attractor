import { describe, expect, it } from "vitest";

import { formatDuration } from "../../src/lib/utils";

describe("formatDuration", () => {
  it("formats durations with hours, minutes, and seconds", () => {
    const start = "2026-04-03T10:00:00.000Z";
    const end = "2026-04-03T12:05:30.000Z";
    expect(formatDuration(start, end)).toBe("2h 5m 30s");
  });

  it("formats durations with minutes and seconds", () => {
    const start = "2026-04-03T10:00:00.000Z";
    const end = "2026-04-03T10:15:45.000Z";
    expect(formatDuration(start, end)).toBe("15m 45s");
  });

  it("formats durations with only seconds", () => {
    const start = "2026-04-03T10:00:00.000Z";
    const end = "2026-04-03T10:00:30.000Z";
    expect(formatDuration(start, end)).toBe("30s");
  });

  it("formats durations with only minutes", () => {
    const start = "2026-04-03T10:00:00.000Z";
    const end = "2026-04-03T10:30:00.000Z";
    expect(formatDuration(start, end)).toBe("30m");
  });

  it("formats durations with only hours", () => {
    const start = "2026-04-03T10:00:00.000Z";
    const end = "2026-04-03T14:00:00.000Z";
    expect(formatDuration(start, end)).toBe("4h");
  });

  it("returns 0s for zero duration", () => {
    const start = "2026-04-03T10:00:00.000Z";
    expect(formatDuration(start, start)).toBe("0s");
  });

  it("returns 0s when end is before start", () => {
    const start = "2026-04-03T10:00:00.000Z";
    const end = "2026-04-03T09:00:00.000Z";
    expect(formatDuration(start, end)).toBe("0s");
  });

  it("ignores milliseconds in calculation", () => {
    const start = "2026-04-03T10:00:00.000Z";
    const end = "2026-04-03T10:00:00.500Z";
    expect(formatDuration(start, end)).toBe("0s");
  });

  it("handles large durations", () => {
    const start = "2026-04-03T00:00:00.000Z";
    const end = "2026-04-05T05:30:45.000Z";
    expect(formatDuration(start, end)).toBe("53h 30m 45s");
  });
});
