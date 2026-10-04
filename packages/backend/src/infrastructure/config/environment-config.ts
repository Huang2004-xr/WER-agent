import type { AppConfig } from "../../app/config.js";

export const readEnvironmentConfig = (environment: NodeJS.ProcessEnv = process.env): AppConfig => {
  const defaults: AppConfig = {
    serviceName: "wer-api",
    version: environment.WER_VERSION ?? "0.1.0",
    httpPort: 8787,
    webOrigin: "http://localhost:5173",
    execution: {
      maxSteps: 8,
      requireApprovalForTools: true,
      requestTimeoutMs: 30_000,
    },
  };
  const integer = (value: string | undefined, fallback: number): number => {
    const parsed = value === undefined ? Number.NaN : Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  };
  return {
    ...defaults,
    serviceName: environment.WER_SERVICE_NAME ?? defaults.serviceName,
    httpPort: integer(environment.PORT, defaults.httpPort),
    webOrigin: environment.WEB_ORIGIN ?? defaults.webOrigin,
    execution: {
      ...defaults.execution,
      maxSteps: integer(environment.WER_MAX_STEPS, defaults.execution.maxSteps ?? 8),
      requestTimeoutMs: integer(environment.WER_REQUEST_TIMEOUT_MS, defaults.execution.requestTimeoutMs),
      requireApprovalForTools: environment.WER_REQUIRE_TOOL_APPROVAL !== "false",
    },
  };
};
