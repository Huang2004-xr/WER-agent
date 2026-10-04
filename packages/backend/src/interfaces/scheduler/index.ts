export interface ScheduledTask { readonly name: string; readonly runAt: Date; readonly execute: () => Promise<void>; }

export class InProcessScheduler {
  schedule(task: ScheduledTask): NodeJS.Timeout {
    const delay = Math.max(0, task.runAt.getTime() - Date.now());
    return setTimeout(() => { void task.execute(); }, delay);
  }
}
