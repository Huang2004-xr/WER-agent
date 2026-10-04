export interface ToolContext { readonly runId: string; readonly signal?: AbortSignal; }
export interface Tool<I = unknown, O = unknown> {
  readonly name: string;
  execute(input: I, context: ToolContext): Promise<O>;
}

export class ToolRegistry {
  private readonly tools = new Map<string, Tool>();
  register(tool: Tool): void { this.tools.set(tool.name, tool); }
  get(name: string): Tool | undefined { return this.tools.get(name); }
}
