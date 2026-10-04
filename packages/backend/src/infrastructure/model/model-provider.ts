export interface ModelProvider {
  readonly name: string;
  complete(prompt: string, options?: { readonly signal?: AbortSignal }): Promise<string>;
}
