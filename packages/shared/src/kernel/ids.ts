export type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type RequestId = Brand<string, "RequestId">;
export type SessionId = Brand<string, "SessionId">;
export type RunId = Brand<string, "RunId">;
export type WorkflowId = Brand<string, "WorkflowId">;
export type SkillId = Brand<string, "SkillId">;
export type ToolCallId = Brand<string, "ToolCallId">;

const brand = <T extends string, Name extends string>(value: T): Brand<T, Name> => value as Brand<T, Name>;

export const requestId = (value: string): RequestId => brand<string, "RequestId">(value);
export const sessionId = (value: string): SessionId => brand<string, "SessionId">(value);
export const runId = (value: string): RunId => brand<string, "RunId">(value);
export const workflowId = (value: string): WorkflowId => brand<string, "WorkflowId">(value);
export const skillId = (value: string): SkillId => brand<string, "SkillId">(value);
export const toolCallId = (value: string): ToolCallId => brand<string, "ToolCallId">(value);
