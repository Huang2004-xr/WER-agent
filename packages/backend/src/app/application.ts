import {
  requestId,
  runId,
  sessionId,
  type ChatRequest,
  type ChatResponse,
  type PlanningRequest,
  type PlanningResponse,
  type RequestContext,
  type RunId,
} from "@wer/shared";
import { ApplicationError, asApplicationError } from "./errors.js";
import type { AppConfig } from "./config.js";
import type { ApplicationPorts } from "./ports.js";

export interface Application {
  readonly config: AppConfig;
  readonly stateStore: ApplicationPorts["stateStore"];
  handleChat(input: ChatRequest, context: { readonly requestId: string }): Promise<ChatResponse>;
  handlePlanning(input: PlanningRequest, context: { readonly requestId: string }): Promise<PlanningResponse>;
  cancelRun(runIdentifier: RunId, reason?: string): Promise<void>;
}

export class DefaultApplication implements Application {
  private readonly idempotentResponses = new Map<string, ChatResponse>();
  private readonly idempotentPlanningResponses = new Map<string, PlanningResponse>();
  private readonly activeControllers = new Map<RunId, AbortController>();

  public constructor(public readonly config: AppConfig, private readonly ports: ApplicationPorts) {}

  get stateStore(): ApplicationPorts["stateStore"] {
    return this.ports.stateStore;
  }

  async handleChat(input: ChatRequest, context: { readonly requestId: string }): Promise<ChatResponse> {
    if (input.idempotencyKey) {
      const previous = this.idempotentResponses.get(input.idempotencyKey);
      if (previous) return previous;
      const stored = await this.ports.stateStore.findByIdempotencyKey?.(input.idempotencyKey);
      if (stored && stored.status === "completed") {
        const response: ChatResponse = { runId: stored.runId, message: stored.output ?? "", status: "completed" };
        this.idempotentResponses.set(input.idempotencyKey, response);
        return response;
      }
    }
    if (!input.sessionId || !input.message?.trim()) {
      throw new ApplicationError("INVALID_REQUEST", "sessionId and message are required", requestId(context.requestId));
    }
    const currentRunId = runId(this.ports.idGenerator.next());
    const currentSessionId = sessionId(input.sessionId);
    const requestContext = {
      requestId: requestId(context.requestId),
      sessionId: currentSessionId,
      runId: currentRunId,
    } satisfies RequestContext;
    await this.createRun(currentRunId, currentSessionId, requestContext.requestId, input.message, input.idempotencyKey);
    await this.appendEvent({ type: "run.started", at: this.ports.clock.now().toISOString(), ...requestContext });

    try {
      await this.authorizeStep(requestContext);
      const controller = new AbortController();
      this.activeControllers.set(currentRunId, controller);
      const runResult = await this.withTimeout(this.ports.runtime.run({
        runId: currentRunId,
        requestId: requestContext.requestId,
        sessionId: currentSessionId,
        message: input.message,
        signal: controller.signal,
      }), controller);
      const status = runResult.status === "waiting_approval" ? "waiting" : "completed";
      const message = runResult.output ?? (status === "waiting" ? "等待人工审批后继续执行" : "");
      await this.ports.stateStore.update(currentRunId, {
        status: status === "waiting" ? "waiting_approval" : "completed",
        output: message,
        step: runResult.steps,
        ...(runResult.checkpoint ? { checkpoint: runResult.checkpoint } : {}),
      });
      await this.appendEvent({ type: status === "waiting" ? "run.waiting_approval" : "run.completed", at: this.ports.clock.now().toISOString(), ...requestContext });
      const response: ChatResponse = { runId: currentRunId, message, status };
      if (input.idempotencyKey) this.idempotentResponses.set(input.idempotencyKey, response);
      return response;
    } catch (error) {
      await this.markFailed(currentRunId, requestContext, error);
      const state = await this.ports.stateStore.get(currentRunId);
      if (state?.status === "cancelled") throw new ApplicationError("RUN_CANCELLED", state.cancelReason ?? "run cancelled", requestId(context.requestId));
      throw this.toRunError(error, context.requestId);
    } finally {
      this.activeControllers.delete(currentRunId);
    }
  }

  async handlePlanning(input: PlanningRequest, context: { readonly requestId: string }): Promise<PlanningResponse> {
    if (input.idempotencyKey) {
      const previous = this.idempotentPlanningResponses.get(input.idempotencyKey);
      if (previous) return previous;
    }
    if (!input.sessionId || !input.requirement?.trim()) {
      throw new ApplicationError("INVALID_REQUEST", "sessionId and requirement are required", requestId(context.requestId));
    }
    const currentRunId = runId(this.ports.idGenerator.next());
    const currentSessionId = sessionId(input.sessionId);
    const requestContext = {
      requestId: requestId(context.requestId),
      sessionId: currentSessionId,
      runId: currentRunId,
    } satisfies RequestContext;
    await this.createRun(currentRunId, currentSessionId, requestContext.requestId, input.requirement, input.idempotencyKey);
    await this.appendEvent({ type: "run.started", at: this.ports.clock.now().toISOString(), ...requestContext });

    try {
      await this.authorizeStep(requestContext);
      const { sessionId: _sessionId, requestId: _requestId, idempotencyKey: _idempotencyKey, ...planningInput } = input;
      const result = await this.withTimeout(this.ports.planning.createPlan(planningInput), new AbortController());
      const response: PlanningResponse = { runId: currentRunId, status: "completed", result };
      await this.ports.stateStore.update(currentRunId, { status: "completed", output: JSON.stringify(result) });
      await this.appendEvent({ type: "planning.completed", at: this.ports.clock.now().toISOString(), ...requestContext });
      if (input.idempotencyKey) this.idempotentPlanningResponses.set(input.idempotencyKey, response);
      return response;
    } catch (error) {
      await this.markFailed(currentRunId, requestContext, error);
      throw this.toRunError(error, context.requestId, "planning execution failed");
    }
  }

  private async createRun(currentRunId: ReturnType<typeof runId>, currentSessionId: ReturnType<typeof sessionId>, requestIdentifier: ReturnType<typeof requestId>, input: string, idempotencyKey?: string): Promise<void> {
    const now = this.ports.clock.now().toISOString();
    await this.ports.stateStore.create({
      runId: currentRunId,
      sessionId: currentSessionId,
      requestId: requestIdentifier,
      ...(idempotencyKey ? { idempotencyKey } : {}),
      status: "created",
      input,
      step: 0,
      version: 0,
      createdAt: now,
      updatedAt: now,
    });
    await this.ports.stateStore.update(currentRunId, { status: "running" });
  }

  private async authorizeStep(context: {
    readonly requestId: RequestContext["requestId"];
    readonly sessionId: ReturnType<typeof sessionId>;
    readonly runId: ReturnType<typeof runId>;
  }): Promise<void> {
    await this.ports.harness.beforeStep({
      requestId: context.requestId,
      sessionId: context.sessionId,
      runId: context.runId,
      step: 1,
      startedAt: Date.now(),
    });
  }

  private async markFailed(runIdValue: ReturnType<typeof runId>, context: RequestContext, error: unknown): Promise<void> {
    try {
      const current = await this.ports.stateStore.get(runIdValue);
      if (current?.status !== "cancelled" && current?.status !== "completed") {
        await this.ports.stateStore.update(runIdValue, { status: "failed" });
      }
    } finally {
      await this.appendEvent({
        runId: runIdValue,
        type: "run.failed",
        at: this.ports.clock.now().toISOString(),
        ...context,
        data: { reason: error instanceof Error ? error.message : "unknown error" },
      });
    }
  }

  private toRunError(error: unknown, requestIdentifier: string, message = "agent execution failed"): ApplicationError {
    const typed = asApplicationError(error, requestId(requestIdentifier));
    return typed.code === "INTERNAL_ERROR" ? new ApplicationError("RUN_FAILED", message, requestId(requestIdentifier), error) : typed;
  }

  private async appendEvent(event: Parameters<ApplicationPorts["eventSink"]["append"]>[0]): Promise<void> {
    await this.ports.eventSink.append(event);
  }

  async cancelRun(runIdentifier: RunId, reason = "cancelled by user"): Promise<void> {
    this.activeControllers.get(runIdentifier)?.abort(reason);
    if (this.ports.stateStore.requestCancellation) await this.ports.stateStore.requestCancellation(runIdentifier, reason);
  }

  private async withTimeout<T>(promise: Promise<T>, controller: AbortController): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        controller.abort("execution timeout");
        reject(new ApplicationError("RUN_TIMEOUT", "agent execution timed out"));
      }, this.config.execution.requestTimeoutMs);
      void promise.then(
        (value) => { clearTimeout(timer); resolve(value); },
        (error: unknown) => { clearTimeout(timer); reject(error); },
      );
    });
  }
}

export { createApplication } from "./container.js";
