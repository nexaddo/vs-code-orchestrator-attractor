import { describe, expect, it } from "vitest";
import { buildToast } from "../../src/dashboard/toast-projection";

describe("buildToast", () => {
  it("builds info toast with empty actions", () => {
    const payload = buildToast("Info message", "info");

    expect(payload).toStrictEqual({
      message: "Info message",
      severity: "info",
      actions: []
    });
  });

  it("builds warning toast with actions array", () => {
    const actions = ["dismiss", "learn-more"];
    const payload = buildToast("Warning message", "warning", actions);

    expect(payload).toStrictEqual({
      message: "Warning message",
      severity: "warning",
      actions
    });
  });

  it("builds error toast", () => {
    const payload = buildToast("Error occurred", "error");

    expect(payload).toStrictEqual({
      message: "Error occurred",
      severity: "error",
      actions: []
    });
  });

  it("defaults actions to empty array when omitted", () => {
    const infoPayload = buildToast("Info", "info");
    const warningPayload = buildToast("Warning", "warning");
    const errorPayload = buildToast("Error", "error");

    expect(infoPayload.actions).toStrictEqual([]);
    expect(warningPayload.actions).toStrictEqual([]);
    expect(errorPayload.actions).toStrictEqual([]);
  });

  it("preserves actions when provided", () => {
    const actions = ["action1", "action2", "action3"];
    const payload = buildToast("Message with actions", "info", actions);

    expect(payload.actions).toBe(actions);
    expect(payload.actions).toHaveLength(3);
  });

  it("handles empty actions array explicitly", () => {
    const payload = buildToast("Message", "warning", []);

    expect(payload.actions).toStrictEqual([]);
  });
});
