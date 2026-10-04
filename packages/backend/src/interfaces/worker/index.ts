import type { AgentRuntime } from "../../modules/agent-runtime/index.js";
import type { RunId } from "@wer/shared";

export interface WorkerJob { readonly runId: RunId; readonly message: string; }

export class AgentWorker {
  public constructor(private readonly runtime: AgentRuntime) {}

  async execute(job: WorkerJob): Promise<string> {
    const result = await this.runtime.run(job);
    return result.output ?? "";
  }
}
