import type { RuntimeEvent } from "@wer/shared";

export interface EventSink { append(event: RuntimeEvent): Promise<void>; }

export class InMemoryEventSink implements EventSink {
  readonly events: RuntimeEvent[] = [];
  async append(event: RuntimeEvent): Promise<void> { this.events.push(event); }
}
