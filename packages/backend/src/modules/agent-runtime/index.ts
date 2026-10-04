import type { RequestId, RunId, SessionId } from "@wer/shared";
import { DefaultHarness, type Harness } from "../harness/index.js";

export type AgentModelResponse =
  | { readonly type: "tool_call"; readonly toolName: string; readonly input: unknown; readonly sideEffect?: boolean; readonly usage?: ModelUsage }
  | { readonly type: "final"; readonly text: string; readonly usage?: ModelUsage };

export interface ModelUsage {
  readonly tokens?: number;
  readonly cost?: number;
}

export interface AgentMessage {
  readonly role: "user" | "assistant" | "tool";
  readonly content: string;
}

export interface AgentModel {
  respond(input: {
    readonly message: string;
    readonly step: number;
    readonly messages: readonly AgentMessage[];
    readonly toolResult?: unknown;
    readonly signal?: AbortSignal;
  }): Promise<AgentModelResponse>;
}

export interface ToolExecutor {
  execute(toolName: string, input: unknown, options?: { readonly signal?: AbortSignal }): Promise<unknown>;
}

export interface AgentRunInput {
  readonly runId: RunId;
  readonly requestId?: RequestId;
  readonly sessionId?: SessionId;
  readonly message: string;
  readonly signal?: AbortSignal;
  readonly checkpoint?: AgentCheckpoint;
}

export interface AgentCheckpoint {
  readonly step: number;
  readonly messages: readonly AgentMessage[];
  readonly pendingTool?: { readonly toolName: string; readonly input: unknown };
}

export interface AgentRunResult {
  readonly status: "completed" | "waiting_approval";
  readonly output?: string;
  readonly steps: number;
  readonly checkpoint?: AgentCheckpoint;
}

export interface AgentRuntime {
  run(input: AgentRunInput): Promise<AgentRunResult>;
}

export class BasicAgentRuntime implements AgentRuntime {
  public constructor(
    private readonly model: AgentModel,
    private readonly harness: Harness,
    private readonly tools?: ToolExecutor,
  ) {}

  async run(input: AgentRunInput): Promise<AgentRunResult> {
    let toolResult: unknown;
    const messages: AgentMessage[] = input.checkpoint?.messages ? [...input.checkpoint.messages] : [{ role: "user", content: input.message }];
    const startedAt = Date.now();
    for (let step = (input.checkpoint?.step ?? 0) + 1; ; step += 1) {
      const context = {
        requestId: input.requestId ?? ("runtime-request" as RequestId),
        sessionId: input.sessionId ?? ("runtime-session" as SessionId),
        runId: input.runId,
        step,
        startedAt,
        ...(input.signal ? { signal: input.signal } : {}),
      };
      await this.harness.beforeStep(context);
      const response = await this.model.respond({ message: input.message, step, messages, toolResult, ...(input.signal ? { signal: input.signal } : {}) });
      if (response.usage) await this.harness.consumeBudget({ runId: input.runId, ...response.usage });
      if (response.type === "final") {
        messages.push({ role: "assistant", content: response.text });
        return { status: "completed", output: response.text, steps: step, checkpoint: { step, messages } };
      }

      const decision = await this.harness.authorizeTool({ ...context, toolName: response.toolName, sideEffect: response.sideEffect ?? false });
      if (decision.decision === "approval_required") {
        return { status: "waiting_approval", steps: step, checkpoint: { step, messages, pendingTool: { toolName: response.toolName, input: response.input } } };
      }
      if (!this.tools) throw new Error(`no executor registered for tool ${response.toolName}`);
      toolResult = await this.tools.execute(response.toolName, response.input, input.signal ? { signal: input.signal } : undefined);
      messages.push({ role: "assistant", content: `调用工具：${response.toolName}` });
      messages.push({ role: "tool", content: stringifyToolResult(toolResult) });
    }
  }
}

export interface ModelGateway {
  complete(input: string, options?: { readonly signal?: AbortSignal }): Promise<string>;
}

export class DemoModelGateway implements ModelGateway {
  async complete(input: string): Promise<string> {
    return `已收到策划需求：${input}`;
  }
}

class ModelGatewayAdapter implements AgentModel {
  public constructor(private readonly gateway: ModelGateway) {}

  async respond(input: { readonly message: string; readonly step: number; readonly messages: readonly AgentMessage[]; readonly toolResult?: unknown; readonly signal?: AbortSignal }): Promise<AgentModelResponse> {
    return { type: "final", text: await this.gateway.complete(input.message, input.signal ? { signal: input.signal } : undefined) };
  }
}

const stringifyToolResult = (value: unknown): string => {
  if (typeof value === "string") return value;
  const encoded = JSON.stringify(value);
  return encoded === undefined ? String(value) : encoded;
};

export class DefaultAgentRuntime extends BasicAgentRuntime {
  public constructor(gateway: ModelGateway, harness?: Harness, tools?: ToolExecutor) {
    super(new ModelGatewayAdapter(gateway), harness ?? new DefaultHarness(), tools);
  }
}
