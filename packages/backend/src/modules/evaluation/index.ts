export interface EvaluationResult { readonly passed: boolean; readonly checks: readonly string[]; }
export interface Evaluator { evaluate(output: string): Promise<EvaluationResult>; }

export class BasicEvaluator implements Evaluator {
  async evaluate(output: string): Promise<EvaluationResult> {
    const passed = output.trim().length > 0;
    return { passed, checks: [passed ? "non-empty-output" : "empty-output"] };
  }
}
