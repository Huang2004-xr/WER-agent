import type { SessionId } from "@wer/shared";

export type MemoryLayer = "working" | "episodic" | "semantic";

export interface MemoryItem {
  readonly sessionId: SessionId;
  readonly layer: MemoryLayer;
  readonly content: string;
  readonly createdAt: string;
}

export interface MemoryStore {
  append(item: MemoryItem): Promise<void>;
  search(sessionId: SessionId, query: string): Promise<readonly MemoryItem[]>;
}
