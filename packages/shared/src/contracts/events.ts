import type { JsonObject } from "../types/json.js";
import type { RequestId, RunId, SessionId } from "../kernel/ids.js";

export type RuntimeEventType =
  | "run.started"
  | "run.step.started"
  | "run.step.completed"
  | "run.completed"
  | "run.waiting_approval"
  | "run.failed"
  | "run.cancelled"
  | "tool.called"
  | "approval.requested"
  | "state.changed"
  | "planning.completed";

export interface RuntimeEvent {
  readonly runId: RunId;
  readonly type: RuntimeEventType;
  readonly at: string;
  readonly requestId?: RequestId;
  readonly sessionId?: SessionId;
  readonly data?: JsonObject;
}
