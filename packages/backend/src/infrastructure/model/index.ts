export interface ModelProvider { readonly name: string; complete(prompt: string): Promise<string>; }
