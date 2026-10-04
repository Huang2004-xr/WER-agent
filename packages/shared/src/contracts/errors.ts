import type { RequestId } from "../kernel/ids.js";

export type ErrorCode =
  | "INVALID_REQUEST"
  | "RUN_FAILED"
  | "RUN_TIMEOUT"
  | "RUN_CANCELLED"
  | "NOT_FOUND"
  | "POLICY_DENIED"
  | "INTERNAL_ERROR";

export interface ApiErrorResponse {
  readonly error: {
    readonly code: ErrorCode;
    readonly message: string;
    readonly requestId?: RequestId;
  };
}
