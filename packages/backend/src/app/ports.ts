import type { Clock, RequestContext, RuntimeEvent, RunId, SessionId } from "@wer/shared";
import type { AgentRuntime } from "../modules/agent-runtime/index.js";
import type { Harness } from "../modules/harness/index.js";
import type { EventSink } from "../modules/observability/index.js";
import type { PlanningPipeline } from "../modules/planning/index.js";
import type { StateStore } from "../modules/state/index.js";
import type { IdGenerator } from "../infrastructure/identity/uuid-id-generator.js";

export interface RunRequest {
  readonly runId: RunId;
  readonly sessionId: SessionId;
  readonly message: string;
  readonly context: RequestContext;
  readonly signal?: AbortSignal;
}

export interface ApplicationPorts {
  readonly runtime: AgentRuntime;
  readonly harness: Harness;
  readonly stateStore: StateStore;
  readonly eventSink: EventSink;
  readonly idGenerator: IdGenerator;
  readonly clock: Clock;
  readonly planning: PlanningPipeline;
}

export type { RuntimeEvent };
