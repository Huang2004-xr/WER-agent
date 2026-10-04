export type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type RequestId = Brand<string, "RequestId">;
export type SessionId = Brand<string, "SessionId">;
export type RunId = Brand<string, "RunId">;

export const requestId = (value: string): RequestId => value as RequestId;
export const sessionId = (value: string): SessionId => value as SessionId;
export const runId = (value: string): RunId => value as RunId;

export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export interface ChatRequest {
  readonly sessionId: string;
  readonly message: string;
  readonly requestId?: string;
}

export interface ChatResponse {
  readonly runId: string;
  readonly message: string;
  readonly status: "completed" | "waiting" | "failed";
}

export interface HealthResponse {
  readonly status: "ok";
  readonly service: "wer-api";
  readonly version: string;
}

export interface RuntimeEvent {
  readonly runId: RunId;
  readonly type: "run.started" | "run.completed" | "run.failed" | "tool.called";
  readonly at: string;
  readonly data?: Readonly<Record<string, unknown>>;
}
