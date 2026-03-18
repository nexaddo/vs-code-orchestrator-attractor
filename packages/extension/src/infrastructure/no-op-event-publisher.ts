import type { DomainEvent } from "../domain/events";
import type { EventPublisher } from "../application/ports";

export class NoOpEventPublisher implements EventPublisher {
  async publish(event: DomainEvent): Promise<void> {
    // TODO(M2): persist to events.ndjson
    void event;
    await Promise.resolve();
  }
}
