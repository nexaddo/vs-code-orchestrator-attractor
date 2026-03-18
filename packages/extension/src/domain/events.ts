export interface DomainEvent<TPayload = unknown> {
  readonly id: string;
  readonly name: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly correlationId: string;
  readonly timestamp: string;
  readonly payload: TPayload;
}
