import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InMemoryJobQueue } from "./in-memory-job-queue.js";

describe("InMemoryJobQueue", () => {
  it("preserves FIFO order and returns queued jobs", async () => {
    const queue = new InMemoryJobQueue();

    const first = await queue.enqueue("agent.run", { runId: "run-1" });
    const second = await queue.enqueue("agent.run", { runId: "run-2" });

    assert.equal((await queue.dequeue())?.id, first);
    assert.equal((await queue.dequeue())?.id, second);
    assert.equal(await queue.dequeue(), undefined);
  });
});
