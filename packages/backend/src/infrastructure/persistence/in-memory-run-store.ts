import { InMemoryStateStore } from "../../modules/state/index.js";

/** Persistence adapter seam; replace this implementation with SQL without changing callers. */
export class InMemoryRunStore extends InMemoryStateStore {}
