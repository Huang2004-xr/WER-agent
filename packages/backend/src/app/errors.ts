import type { ErrorCode, RequestId } from "@wer/shared";

export class ApplicationError extends Error {
  public constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly requestId?: RequestId,
    public readonly cause?: unknown,
  ) {
    super(message, { cause });
    this.name = "ApplicationError";
  }
}

export const asApplicationError = (error: unknown, requestId?: RequestId): ApplicationError => {
  if (error instanceof ApplicationError) return error;
  return new ApplicationError("INTERNAL_ERROR", "agent execution failed", requestId, error);
};
