import type { RequestId, RunId, RuntimeEvent, SessionId } from "@wer/shared";

export interface ExecutionPolicy {
  readonly maxSteps?: number;
  readonly maxToolCalls?: number;
  readonly maxTokens?: number;
  readonly maxCost?: number;
  readonly maxDurationMs?: number;
  readonly requireApprovalForTools?: boolean;
  readonly requireApprovalForSideEffects?: boolean;
  readonly allowedTools?: readonly string[];
}

export interface ExecutionContext {
  readonly requestId: RequestId;
  readonly sessionId: SessionId;
  readonly runId: RunId;
  readonly step: number;
  readonly startedAt: number;
  readonly signal?: AbortSignal;
}

export interface ToolAuthorizationInput extends ExecutionContext {
  readonly toolName: string;
  readonly sideEffect: boolean;
}

export type AuthorizationDecision =
  | { readonly decision: "allow" }
  | { readonly decision: "approval_required"; readonly reason?: string };

export interface ApprovalRequest {
  readonly runId: RunId;
  readonly toolName: string;
  readonly input: unknown;
  readonly reason?: string;
}

export type ApprovalDecision = "approved" | "rejected" | "pending";

export interface BudgetUsage {
  readonly runId?: RunId;
  readonly tokens?: number;
  readonly cost?: number;
  readonly toolCalls?: number;
}

export interface Harness {
  beforeStep(context: ExecutionContext): Promise<void>;
  authorizeTool(input: ToolAuthorizationInput): Promise<AuthorizationDecision>;
  consumeBudget(usage: BudgetUsage): Promise<void>;
  checkCancellation(runId: RunId): Promise<void>;
  requestApproval(input: ApprovalRequest): Promise<ApprovalDecision>;
  record(event: RuntimeEvent): Promise<void>;
}

export class HarnessLimitError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "HarnessLimitError";
  }
}

export class ToolDeniedError extends Error {
  public constructor(public readonly toolName: string) {
    super(`tool ${toolName} is not allowed by execution policy`);
    this.name = "ToolDeniedError";
  }
}

interface Usage {
  tokens: number;
  cost: number;
  toolCalls: number;
}

const defaultPolicy: Required<Pick<ExecutionPolicy, "maxSteps" | "requireApprovalForTools" | "requireApprovalForSideEffects">> = {
  maxSteps: 8,
  requireApprovalForTools: false,
  requireApprovalForSideEffects: true,
};

export class DefaultHarness implements Harness {
  private readonly usage = new Map<RunId, Usage>();
  private readonly cancelled = new Map<RunId, string>();
  private readonly approvals = new Map<string, ApprovalDecision>();
  private readonly events: RuntimeEvent[] = [];
  private readonly policy: ExecutionPolicy & typeof defaultPolicy;

  public constructor(policy: ExecutionPolicy = {}) {
    this.policy = { ...defaultPolicy, ...policy };
  }

  async beforeStep(context: ExecutionContext): Promise<void> {
    if (context.step > this.policy.maxSteps) throw new HarnessLimitError(`run ${context.runId} exceeded the step budget`);
    await this.checkCancellation(context.runId);
    if (this.policy.maxDurationMs !== undefined && Date.now() - context.startedAt > this.policy.maxDurationMs) {
      throw new HarnessLimitError(`run ${context.runId} exceeded the time budget`);
    }
    if (context.signal?.aborted) throw new HarnessLimitError(`run ${context.runId} was cancelled`);
  }

  async authorizeTool(input: ToolAuthorizationInput): Promise<AuthorizationDecision> {
    if (this.policy.allowedTools && !this.policy.allowedTools.includes(input.toolName)) throw new ToolDeniedError(input.toolName);
    await this.beforeStep(input);
    const usage = this.getUsage(input.runId);
    if (this.policy.maxToolCalls !== undefined && usage.toolCalls + 1 > this.policy.maxToolCalls) {
      throw new HarnessLimitError(`run ${input.runId} exceeded the tool-call budget`);
    }
    usage.toolCalls += 1;
    if (this.policy.requireApprovalForTools || (this.policy.requireApprovalForSideEffects && input.sideEffect)) {
      return { decision: "approval_required" };
    }
    return { decision: "allow" };
  }

  async consumeBudget(input: BudgetUsage): Promise<void> {
    const usage = this.getUsage(input.runId ?? ("__global__" as RunId));
    usage.tokens += input.tokens ?? 0;
    usage.cost += input.cost ?? 0;
    usage.toolCalls += input.toolCalls ?? 0;
    if (this.policy.maxTokens !== undefined && usage.tokens > this.policy.maxTokens) throw new HarnessLimitError("token budget exceeded");
    if (this.policy.maxCost !== undefined && usage.cost > this.policy.maxCost) throw new HarnessLimitError("cost budget exceeded");
    if (this.policy.maxToolCalls !== undefined && usage.toolCalls > this.policy.maxToolCalls) throw new HarnessLimitError("tool-call budget exceeded");
  }

  async checkCancellation(runId: RunId): Promise<void> {
    const reason = this.cancelled.get(runId);
    if (reason) throw new HarnessLimitError(`run ${runId} was cancelled: ${reason}`);
  }

  async requestApproval(input: ApprovalRequest): Promise<ApprovalDecision> {
    return this.approvals.get(this.approvalKey(input)) ?? "pending";
  }

  async record(event: RuntimeEvent): Promise<void> {
    this.events.push(event);
  }

  cancel(runId: RunId, reason = "cancelled by user"): void {
    this.cancelled.set(runId, reason);
  }

  resolveApproval(input: ApprovalRequest, decision: Exclude<ApprovalDecision, "pending">): void {
    this.approvals.set(this.approvalKey(input), decision);
  }

  get auditEvents(): readonly RuntimeEvent[] {
    return [...this.events];
  }

  private approvalKey(input: ApprovalRequest): string {
    return `${input.runId}:${input.toolName}:${JSON.stringify(input.input)}`;
  }

  private getUsage(runId: RunId): Usage {
    const usage = this.usage.get(runId);
    if (usage) return usage;
    const created = { tokens: 0, cost: 0, toolCalls: 0 };
    this.usage.set(runId, created);
    return created;
  }
}
