import { type ToastPayload } from "@attractor/shared";

export type ToastSeverity = "info" | "warning" | "error";

/**
 * Builds a ToastPayload with the given message, severity, and optional actions.
 *
 * Pure synchronous builder — no storage access or async logic.
 *
 * @param message - The toast message (required)
 * @param severity - The toast severity level
 * @param actions - Optional array of action labels; defaults to empty array
 */
export function buildToast(
  message: string,
  severity: ToastSeverity,
  actions: string[] = []
): ToastPayload {
  return { message, severity, actions };
}
