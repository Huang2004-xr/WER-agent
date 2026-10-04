export interface Clock { now(): Date; }
export class SystemClock implements Clock { now(): Date { return new Date(); } }

export interface IdGenerator { next(): string; }
export class RandomIdGenerator implements IdGenerator {
  next(): string { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
}

export interface PersistenceAdapter { readonly name: string; }
export interface QueueAdapter { enqueue(name: string, payload: unknown): Promise<void>; }
export interface FileStorageAdapter { put(key: string, content: Uint8Array): Promise<void>; }
