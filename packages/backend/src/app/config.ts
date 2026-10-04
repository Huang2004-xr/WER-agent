import type { ExecutionPolicy } from "../modules/harness/index.js";

export interface AppConfig {
  readonly serviceName: string;
  readonly version: string;
  readonly httpPort: number;
  readonly webOrigin: string;
  readonly execution: ExecutionPolicy & { readonly requestTimeoutMs: number };
}

const positiveInteger = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const defaultConfig = (): AppConfig => ({
  serviceName: "wer-api",
  version: "0.1.0",
  httpPort: 8787,
  webOrigin: "http://localhost:5173",
  execution: {
    maxSteps: 8,
    requireApprovalForTools: true,
    requestTimeoutMs: 30_000,
  },
});
