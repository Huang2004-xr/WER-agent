import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readEnvironmentConfig } from "./environment-config.js";

describe("readEnvironmentConfig", () => {
  it("uses safe defaults when environment variables are absent", () => {
    const config = readEnvironmentConfig({});

    assert.equal(config.serviceName, "wer-api");
    assert.equal(config.httpPort, 8787);
    assert.equal(config.execution.maxSteps, 8);
  });

  it("parses numeric execution settings", () => {
    const config = readEnvironmentConfig({
      PORT: "9000",
      WER_MAX_STEPS: "12",
      WER_REQUEST_TIMEOUT_MS: "5000",
    });

    assert.equal(config.httpPort, 9000);
    assert.equal(config.execution.maxSteps, 12);
    assert.equal(config.execution.requestTimeoutMs, 5000);
  });
});
