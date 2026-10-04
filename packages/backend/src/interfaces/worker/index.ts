import type { AgentRuntime } from "../../modules/agent-runtime/index.js";
import type { RunId } from "@wer/shared";

export interface WorkerJob { readonly runId: RunId; readonly message: string; }

export class AgentWorker {
  public constructor(private readonly runtime: AgentRuntime) {}

  execute(job: WorkerJob): Promise<string> {
    return this.runtime.run(job);
  }
}
