import type { RunId } from "@wer/shared";

export interface ExecutionPolicy {
  readonly maxSteps: number;
  readonly requireApprovalForTools: boolean;
}

export interface Harness {
  authorize(input: { readonly runId: RunId; readonly step: number }): void;
}

export class DefaultHarness implements Harness {
  public constructor(private readonly policy: ExecutionPolicy = { maxSteps: 8, requireApprovalForTools: true }) {}

  authorize(input: { readonly runId: RunId; readonly step: number }): void {
    if (input.step > this.policy.maxSteps) {
      throw new Error(`run ${input.runId} exceeded the step budget`);
    }
  }
}
