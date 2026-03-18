import type { DomainEvent } from "../domain/events";
import type { EventPublisher } from "../application/ports";

export class NoOpEventPublisher implements EventPublisher {
  async publish(event: DomainEvent): Promise<void> {
    void event;
    // No-op: in M4 this will broadcast to webview via Copilot adapter
  }
}
