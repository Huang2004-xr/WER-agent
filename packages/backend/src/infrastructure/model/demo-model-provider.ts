import type { ModelProvider } from "./model-provider.js";

export class DemoModelProvider implements ModelProvider {
  readonly name = "demo";

  async complete(prompt: string, options?: { readonly signal?: AbortSignal }): Promise<string> {
    if (options?.signal?.aborted) throw new DOMException("The model request was aborted", "AbortError");
    return `已收到策划需求：${prompt}`;
  }
}
