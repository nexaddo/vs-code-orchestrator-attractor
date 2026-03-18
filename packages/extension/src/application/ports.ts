import type { DomainEvent } from "../domain/events";

export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
}
