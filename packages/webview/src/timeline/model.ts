import type { EventEnvelope } from "@attractor/shared";

export interface TimelineState {
  runId: string;
  events: EventEnvelope[];
}
