import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runId, requestId, sessionId } from "@wer/shared";
import { BasicAgentRuntime, type AgentModel, type ToolExecutor } from "./index.js";
import { DefaultHarness } from "../harness/index.js";

const input = { runId: runId("run-1"), requestId: requestId("request-1"), sessionId: sessionId("session-1"), message: "生成方案" };

describe("BasicAgentRuntime", () => {
  it("loops through tool calls and returns the final model answer", async () => {
    const responses = [
      { type: "tool_call" as const, toolName: "search", input: { query: "品牌资料" } },
      { type: "final" as const, text: "这是基于资料生成的方案" },
    ];
    const model: AgentModel = { respond: async () => responses.shift()! };
    const tools: ToolExecutor = { execute: async () => ({ result: "资料" }) };
    const runtime = new BasicAgentRuntime(model, new DefaultHarness(), tools);

    const result = await runtime.run(input);

    assert.equal(result.status, "completed");
    assert.equal(result.output, "这是基于资料生成的方案");
    assert.equal(result.steps, 2);
  });

  it("returns a checkpoint when the model asks for approval", async () => {
    const model: AgentModel = { respond: async () => ({ type: "tool_call", toolName: "publish", input: {}, sideEffect: true }) };
    const runtime = new BasicAgentRuntime(model, new DefaultHarness({ maxSteps: 3 }));

    const result = await runtime.run(input);

    assert.equal(result.status, "waiting_approval");
    assert.equal(result.checkpoint?.step, 1);
    assert.equal(result.checkpoint?.pendingTool?.toolName, "publish");
  });
});
