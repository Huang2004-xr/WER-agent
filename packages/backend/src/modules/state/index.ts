import type { RequestId, RunId, SessionId } from "@wer/shared";

export type RunStatus = "created" | "running" | "waiting_approval" | "paused" | "completed" | "failed" | "cancelled";

export interface RunCheckpoint {
  readonly step: number;
  readonly messages: readonly { readonly role: "user" | "assistant" | "tool"; readonly content: string }[];
  readonly pendingTool?: { readonly toolName: string; readonly input: unknown; readonly sideEffect?: boolean };
}

export interface RunState {
  readonly runId: RunId;
  readonly sessionId: SessionId;
  readonly requestId?: RequestId;
  readonly idempotencyKey?: string;
  readonly status: RunStatus;
  readonly step?: number;
  readonly input?: string;
  readonly version?: number;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly output?: string;
  readonly checkpoint?: RunCheckpoint;
  readonly cancelReason?: string;
}

export class InvalidStateTransitionError extends Error {
  public constructor(from: RunStatus, to: RunStatus) {
    super(`invalid run state transition: ${from} -> ${to}`);
    this.name = "InvalidStateTransitionError";
  }
}

export class VersionConflictError extends Error {
  public constructor() {
    super("run state version conflict");
    this.name = "VersionConflictError";
  }
}

export interface StateStore {
  create(run: RunState): Promise<void>;
  get(runId: RunId): Promise<RunState | undefined>;
  update(runId: RunId, patch: Partial<RunState>): Promise<RunState>;
  updateIfVersion?(runId: RunId, expectedVersion: number, patch: Partial<RunState>): Promise<RunState>;
  findByIdempotencyKey?(key: string): Promise<RunState | undefined>;
  requestCancellation?(runId: RunId, reason?: string): Promise<RunState>;
}

const allowed: Record<RunStatus, readonly RunStatus[]> = {
  created: ["running", "cancelled", "failed"],
  running: ["running", "waiting_approval", "paused", "completed", "failed", "cancelled"],
  waiting_approval: ["waiting_approval", "running", "paused", "completed", "failed", "cancelled"],
  paused: ["paused", "running", "failed", "cancelled"],
  completed: [],
  failed: [],
  cancelled: [],
};
