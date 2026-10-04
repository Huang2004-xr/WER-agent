import type { RequestId, RunId, SessionId } from "../kernel/ids.js";

export interface ChatRequest {
  readonly sessionId: string;
  readonly message: string;
  readonly requestId?: string;
  readonly idempotencyKey?: string;
}

export interface RequestContext {
  readonly requestId: RequestId;
  readonly sessionId?: SessionId;
  readonly runId?: RunId;
}

export interface ChatResponse {
  readonly runId: string;
  readonly message: string;
  readonly status: "completed" | "waiting" | "failed";
}
