import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ChatRequest, ChatResponse, HealthResponse, RuntimeEvent } from "@wer/shared";
import { runId, sessionId } from "@wer/shared";
import { BasicAgentRuntime, DemoModelGateway } from "../modules/agent-runtime/index.js";
import { DefaultHarness } from "../modules/harness/index.js";
import { InMemoryStateStore } from "../modules/state/index.js";
import { InMemoryEventSink } from "../modules/observability/index.js";

const runtime = new BasicAgentRuntime(new DemoModelGateway());
const harness = new DefaultHarness();
const state = new InMemoryStateStore();
const events = new InMemoryEventSink();

const json = (response: ServerResponse, body: unknown): void => {
  response.statusCode = response.statusCode || 200;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
};

const readBody = async (request: IncomingMessage): Promise<ChatRequest> => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as ChatRequest;
};

export const createApi = () => async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
  response.setHeader("access-control-allow-origin", process.env.WEB_ORIGIN ?? "http://localhost:5173");
  response.setHeader("access-control-allow-headers", "content-type");
  response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  if (request.method === "GET" && url.pathname === "/health") {
    json(response, { status: "ok", service: "wer-api", version: "0.1.0" } satisfies HealthResponse);
    return;
  }
  if (request.method === "POST" && url.pathname === "/api/chat") {
    try {
      const input = await readBody(request);
      if (!input.sessionId || !input.message?.trim()) {
        response.statusCode = 400;
        json(response, { error: "sessionId and message are required" });
        return;
      }
      const id = runId(randomUUID());
      const session = sessionId(input.sessionId);
      await state.create({ runId: id, sessionId: session, status: "running" });
      await events.append({ runId: id, type: "run.started", at: new Date().toISOString() } satisfies RuntimeEvent);
      harness.authorize({ runId: id, step: 1 });
      const message = await runtime.run({ runId: id, message: input.message });
      await state.update(id, { status: "completed", output: message });
      await events.append({ runId: id, type: "run.completed", at: new Date().toISOString() } satisfies RuntimeEvent);
      json(response, { runId: id, message, status: "completed" } satisfies ChatResponse);
    } catch (error) {
      response.statusCode = 500;
      json(response, { error: error instanceof Error ? error.message : "unknown error" });
    }
    return;
  }
  response.statusCode = 404;
  json(response, { error: "not found" });
};
