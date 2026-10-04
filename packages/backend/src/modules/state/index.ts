import type { RunId, SessionId } from "@wer/shared";

export interface RunState {
  readonly runId: RunId;
  readonly sessionId: SessionId;
  status: "running" | "completed" | "failed";
  output?: string;
}

export interface StateStore {
  create(run: RunState): Promise<void>;
  get(runId: RunId): Promise<RunState | undefined>;
  update(runId: RunId, patch: Partial<RunState>): Promise<void>;
}

export class InMemoryStateStore implements StateStore {
  private readonly runs = new Map<RunId, RunState>();

  async create(run: RunState): Promise<void> { this.runs.set(run.runId, { ...run }); }
  async get(runId: RunId): Promise<RunState | undefined> { return this.runs.get(runId); }
  async update(runId: RunId, patch: Partial<RunState>): Promise<void> {
    const current = this.runs.get(runId);
    if (!current) throw new Error(`run ${runId} not found`);
    this.runs.set(runId, { ...current, ...patch });
  }
}
