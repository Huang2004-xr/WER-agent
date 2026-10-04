import type { RunId } from "@wer/shared";

export interface ModelGateway {
  complete(input: string): Promise<string>;
}

export interface AgentRuntime {
  run(input: { readonly runId: RunId; readonly message: string }): Promise<string>;
}

export class DemoModelGateway implements ModelGateway {
  async complete(input: string): Promise<string> {
    return `已收到策划需求：${input}`;
  }
}

export class BasicAgentRuntime implements AgentRuntime {
  public constructor(private readonly model: ModelGateway) {}

  run(input: { readonly runId: RunId; readonly message: string }): Promise<string> {
    return this.model.complete(input.message);
  }
}
