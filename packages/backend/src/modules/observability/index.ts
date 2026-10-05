import type { RuntimeEvent } from "@wer/shared";

export interface EventSink { append(event: RuntimeEvent): Promise<void>; }
