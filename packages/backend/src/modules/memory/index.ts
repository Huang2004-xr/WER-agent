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

export class InMemoryMemoryStore implements MemoryStore {
  private readonly items: MemoryItem[] = [];

  async append(item: MemoryItem): Promise<void> { this.items.push(item); }
  async search(sessionId: SessionId, query: string): Promise<readonly MemoryItem[]> {
    const term = query.toLowerCase();
    return this.items.filter((item) => item.sessionId === sessionId && item.content.toLowerCase().includes(term));
  }
}
