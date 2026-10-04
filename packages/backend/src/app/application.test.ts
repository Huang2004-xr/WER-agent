import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createApplication } from "./container.js";

describe("Application", () => {
  it("creates a run and returns a completed chat response", async () => {
    const application = createApplication({
      idGenerator: { next: () => "run-test-1" },
    });

    const result = await application.handleChat(
      { sessionId: "session-1", message: "写一份新品发布策划" },
      { requestId: "request-1" },
    );

    assert.equal(result.runId, "run-test-1");
    assert.equal(result.status, "completed");
    assert.match(result.message, /新品发布策划/);
  });

  it("returns the same response for a repeated idempotency key", async () => {
    let generated = 0;
    const application = createApplication({
      idGenerator: { next: () => `run-test-${++generated}` },
    });
    const input = { sessionId: "session-1", message: "生成活动主题", idempotencyKey: "idem-1" };

    const first = await application.handleChat(input, { requestId: "request-1" });
    const second = await application.handleChat(input, { requestId: "request-2" });

    assert.deepEqual(second, first);
    assert.equal(generated, 1);
  });

  it("marks a failed run and exposes a typed application error", async () => {
    const application = createApplication({
      runtime: {
        run: async () => {
          throw new Error("model unavailable");
        },
      },
      idGenerator: { next: () => "run-test-failed" },
    });

    await assert.rejects(
      application.handleChat({ sessionId: "session-1", message: "生成方案" }, { requestId: "request-1" }),
      (error: unknown) => {
        assert.equal((error as { code?: string }).code, "RUN_FAILED");
        return true;
      },
    );

    const state = await application.stateStore.get("run-test-failed" as never);
    assert.equal(state?.status, "failed");
  });

  it("runs the planning pipeline through the application harness", async () => {
    const application = createApplication({ idGenerator: { next: () => "planning-run-1" } });

    const result = await application.handlePlanning(
      {
        sessionId: "session-planning",
        requirement: "制定新品传播方案",
        audience: "年轻职场人",
        deadline: "2026-04-01",
        channels: ["小红书"],
      },
      { requestId: "planning-request-1" },
    );

    assert.equal(result.runId, "planning-run-1");
    assert.equal(result.status, "completed");
    assert.equal(result.result.strategy.audience, "年轻职场人");
    assert.equal((await application.stateStore.get("planning-run-1" as never))?.status, "completed");
  });
});
