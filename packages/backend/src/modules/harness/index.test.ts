import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runId, requestId, sessionId } from "@wer/shared";
import { DefaultHarness, HarnessLimitError, ToolDeniedError } from "./index.js";

const context = (step = 1) => ({
  requestId: requestId("request-1"),
  sessionId: sessionId("session-1"),
  runId: runId("run-1"),
  step,
  startedAt: Date.now(),
  signal: new AbortController().signal,
});

describe("DefaultHarness", () => {
  it("enforces step and token budgets", async () => {
    const harness = new DefaultHarness({ maxSteps: 2, maxTokens: 10 });
    await harness.beforeStep(context(1));
    await harness.consumeBudget({ tokens: 10 });
    await assert.rejects(harness.beforeStep(context(3)), HarnessLimitError);
    await assert.rejects(harness.consumeBudget({ tokens: 1 }), HarnessLimitError);
  });

  it("requires approval for side-effect tools and allows read-only tools", async () => {
    const harness = new DefaultHarness({ requireApprovalForSideEffects: true });
    const read = await harness.authorizeTool({ ...context(), toolName: "search", sideEffect: false });
    const write = await harness.authorizeTool({ ...context(), toolName: "publish", sideEffect: true });

    assert.deepEqual(read, { decision: "allow" });
    assert.deepEqual(write, { decision: "approval_required" });
  });

  it("supports cancellation and explicit tool denials", async () => {
    const harness = new DefaultHarness({ allowedTools: ["search"] });
    harness.cancel(runId("run-1"), "用户取消");
    await assert.rejects(harness.checkCancellation(runId("run-1")), HarnessLimitError);
    await assert.rejects(
      harness.authorizeTool({ ...context(), toolName: "delete", sideEffect: true }),
      ToolDeniedError,
    );
  });
});
