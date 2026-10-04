import { randomUUID } from "node:crypto";

export interface QueuedJob<T = unknown> {
  readonly id: string;
  readonly name: string;
  readonly payload: T;
  readonly enqueuedAt: Date;
}

export interface JobQueue {
  enqueue<T>(name: string, payload: T): Promise<string>;
  dequeue<T = unknown>(): Promise<QueuedJob<T> | undefined>;
}

export class InMemoryJobQueue implements JobQueue {
  private readonly jobs: QueuedJob[] = [];

  async enqueue<T>(name: string, payload: T): Promise<string> {
    const id = randomUUID();
    this.jobs.push({ id, name, payload, enqueuedAt: new Date() });
    return id;
  }

  async dequeue<T>(): Promise<QueuedJob<T> | undefined> {
    return this.jobs.shift() as QueuedJob<T> | undefined;
  }
}
