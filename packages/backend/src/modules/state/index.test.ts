import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runId, requestId, sessionId } from "@wer/shared";
import { InMemoryStateStore, InvalidStateTransitionError } from "./index.js";

describe("InMemoryStateStore", () => {
  it("stores checkpoints and increments the version atomically", async () => {
    const store = new InMemoryStateStore();
    const id = runId("run-1");
    await store.create({
      runId: id,
      sessionId: sessionId("session-1"),
      requestId: requestId("request-1"),
      status: "created",
      step: 0,
      input: "生成方案",
      version: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    const updated = await store.updateIfVersion(id, 0, {
      status: "running",
      step: 1,
      checkpoint: { step: 1, messages: [{ role: "user", content: "生成方案" }] },
    });

    assert.equal(updated.version, 1);
    assert.equal((await store.get(id))?.checkpoint?.step, 1);
    await assert.rejects(
      store.updateIfVersion(id, 0, { step: 2 }),
      (error: unknown) => error instanceof Error && error.name === "VersionConflictError",
    );
  });

  it("rejects invalid status transitions and records cancellation", async () => {
    const store = new InMemoryStateStore();
    const id = runId("run-2");
    await store.create({
      runId: id,
      sessionId: sessionId("session-2"),
      requestId: requestId("request-2"),
      status: "created",
      step: 0,
      input: "生成方案",
      version: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    await assert.rejects(store.update(id, { status: "completed" }), InvalidStateTransitionError);
    await store.update(id, { status: "running" });
    await store.requestCancellation(id, "用户取消");

    const state = await store.get(id);
    assert.equal(state?.status, "cancelled");
    assert.equal(state?.cancelReason, "用户取消");
  });

  it("finds a run by idempotency key", async () => {
    const store = new InMemoryStateStore();
    const id = runId("run-3");
    await store.create({
      runId: id,
      sessionId: sessionId("session-3"),
      requestId: requestId("request-3"),
      idempotencyKey: "idem-3",
      status: "created",
      step: 0,
      input: "生成方案",
      version: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    assert.equal((await store.findByIdempotencyKey("idem-3"))?.runId, id);
  });
});
