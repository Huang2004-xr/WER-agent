import type { RequestId, RunId, SessionId } from "@wer/shared";

export type RunStatus = "created" | "running" | "waiting_approval" | "completed" | "failed" | "cancelled";

export interface RunCheckpoint {
  readonly step: number;
  readonly messages: readonly { readonly role: string; readonly content: string }[];
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
  running: ["running", "waiting_approval", "completed", "failed", "cancelled"],
  waiting_approval: ["waiting_approval", "running", "completed", "failed", "cancelled"],
  completed: [],
  failed: [],
  cancelled: [],
};

export class InMemoryStateStore implements StateStore {
  private readonly runs = new Map<RunId, RunState>();

  async create(run: RunState): Promise<void> {
    if (this.runs.has(run.runId)) throw new Error(`run ${run.runId} already exists`);
    this.runs.set(run.runId, clone(run));
  }

  async get(runId: RunId): Promise<RunState | undefined> {
    const run = this.runs.get(runId);
    return run ? clone(run) : undefined;
  }

  async update(runId: RunId, patch: Partial<RunState>): Promise<RunState> {
    const current = this.runs.get(runId);
    if (!current) throw new Error(`run ${runId} not found`);
    if (patch.status && patch.status !== current.status && !allowed[current.status].includes(patch.status)) {
      throw new InvalidStateTransitionError(current.status, patch.status);
    }
    const updated = { ...current, ...patch, version: (current.version ?? 0) + 1, updatedAt: new Date().toISOString() };
    this.runs.set(runId, updated);
    return clone(updated);
  }

  async updateIfVersion(runId: RunId, expectedVersion: number, patch: Partial<RunState>): Promise<RunState> {
    const current = this.runs.get(runId);
    if (!current || (current.version ?? 0) !== expectedVersion) throw new VersionConflictError();
    return this.update(runId, patch);
  }

  async findByIdempotencyKey(key: string): Promise<RunState | undefined> {
    const run = [...this.runs.values()].find((candidate) => candidate.idempotencyKey === key);
    return run ? clone(run) : undefined;
  }

  async requestCancellation(runId: RunId, reason = "cancelled by user"): Promise<RunState> {
    const current = this.runs.get(runId);
    if (current && ["completed", "failed", "cancelled"].includes(current.status)) return clone(current);
    return this.update(runId, { status: "cancelled", cancelReason: reason });
  }
}

const clone = (run: RunState): RunState => ({
  ...run,
  ...(run.checkpoint
    ? {
        checkpoint: {
          ...run.checkpoint,
          messages: run.checkpoint.messages.map((message) => ({ ...message })),
          ...(run.checkpoint.pendingTool ? { pendingTool: { ...run.checkpoint.pendingTool } } : {}),
        },
      }
    : {}),
});
