import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ChatRequest, ChatResponse, HealthResponse, PlanningRequest, PlanningResponse } from "@wer/shared";
import { requestId, runId } from "@wer/shared";
import { createApplication } from "./container.js";
import type { Application } from "./application.js";
import { ApplicationError } from "./errors.js";

export interface ApiOptions {
  readonly application?: Application;
}

const json = (response: ServerResponse, body: unknown, statusCode = 200): void => {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
};

const readBody = async <T>(request: IncomingMessage): Promise<T> => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
};

export const createApi = (options: ApiOptions = {}) => {
  const application = options.application ?? createApplication();
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    response.setHeader("access-control-allow-origin", application.config.webOrigin);
    response.setHeader("access-control-allow-headers", "content-type, idempotency-key, x-request-id");
    response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
    if (request.method === "OPTIONS") {
      response.statusCode = 204;
      response.end();
      return;
    }

    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    if (request.method === "GET" && url.pathname === "/health") {
      json(response, { status: "ok", service: application.config.serviceName, version: application.config.version } satisfies HealthResponse);
      return;
    }

    if (request.method === "POST" && (url.pathname === "/api/chat" || url.pathname === "/api/v1/runs")) {
      const requestIdentifier = request.headers["x-request-id"] ?? randomUUID();
      try {
        const input = await readBody<ChatRequest>(request);
        const idempotencyKey = input.idempotencyKey ?? request.headers["idempotency-key"];
        const result = await application.handleChat(
          idempotencyKey ? { ...input, idempotencyKey: String(idempotencyKey) } : input,
          { requestId: String(requestIdentifier) },
        );
        json(response, result satisfies ChatResponse);
      } catch (error) {
        const appError = error instanceof ApplicationError ? error : new ApplicationError("INVALID_REQUEST", "invalid request", requestId(String(requestIdentifier)), error);
        const status = appError.code === "INVALID_REQUEST" ? 400 : appError.code === "NOT_FOUND" ? 404 : 500;
        json(response, { error: { code: appError.code, message: appError.message, requestId: appError.requestId } }, status);
      }
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/v1/planning/plans") {
      const requestIdentifier = request.headers["x-request-id"] ?? randomUUID();
      try {
        const input = await readBody<PlanningRequest>(request);
        const idempotencyKey = input.idempotencyKey ?? request.headers["idempotency-key"];
        const result = await application.handlePlanning(
          idempotencyKey ? { ...input, idempotencyKey: String(idempotencyKey) } : input,
          { requestId: String(requestIdentifier) },
        );
        json(response, result satisfies PlanningResponse);
      } catch (error) {
        const appError = error instanceof ApplicationError ? error : new ApplicationError("INVALID_REQUEST", "invalid request", requestId(String(requestIdentifier)), error);
        const status = appError.code === "INVALID_REQUEST" ? 400 : appError.code === "NOT_FOUND" ? 404 : 500;
        json(response, { error: { code: appError.code, message: appError.message, requestId: appError.requestId } }, status);
      }
      return;
    }

    const runMatch = url.pathname.match(/^\/api\/v1\/runs\/([^/]+)$/);
    if (request.method === "GET" && runMatch) {
      const foundRunId = runMatch[1];
      if (!foundRunId) {
        json(response, { error: { code: "NOT_FOUND", message: "run not found" } }, 404);
        return;
      }
      const state = await application.stateStore.get(runId(foundRunId));
      if (!state) {
        json(response, { error: { code: "NOT_FOUND", message: "run not found" } }, 404);
        return;
      }
      json(response, state);
      return;
    }

    const cancelMatch = url.pathname.match(/^\/api\/v1\/runs\/([^/]+)\/cancel$/);
    if (request.method === "POST" && cancelMatch) {
      try {
        const foundRunId = cancelMatch[1];
        if (!foundRunId) throw new Error("run not found");
        await application.cancelRun(runId(foundRunId), "用户取消");
        const state = await application.stateStore.get(runId(foundRunId));
        json(response, state);
      } catch {
        json(response, { error: { code: "NOT_FOUND", message: "run not found" } }, 404);
      }
      return;
    }

    json(response, { error: { code: "NOT_FOUND", message: "not found" } }, 404);
  };
};
