export { InMemoryEventStore } from "./in-memory-event-store.js";
export { InMemoryRunStore } from "./in-memory-run-store.js";

export interface PersistenceConnection {
  readonly dialect: "memory" | "mysql" | "postgres";
  connect(): Promise<void>;
}
