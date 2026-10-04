import type { RuntimeEvent } from "@wer/shared";
import type { EventSink } from "../../modules/observability/index.js";

export class InMemoryEventStore implements EventSink {
  readonly events: RuntimeEvent[] = [];

  async append(event: RuntimeEvent): Promise<void> {
    this.events.push(event);
  }
}
