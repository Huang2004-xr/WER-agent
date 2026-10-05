export interface QueuePort<TPayload = unknown> {
  enqueue(type: string, payload: TPayload, options?: { jobId?: string; delayMs?: number; attempts?: number }): Promise<string>;
}
