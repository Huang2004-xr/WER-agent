export interface JobQueue { enqueue<T>(name: string, payload: T): Promise<void>; }
