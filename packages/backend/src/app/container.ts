import { DefaultAgentRuntime, DemoModelGateway, type AgentRuntime } from "../modules/agent-runtime/index.js";
import { DefaultHarness, type Harness } from "../modules/harness/index.js";
import { InMemoryEventSink, type EventSink } from "../modules/observability/index.js";
import { InMemoryStateStore, type StateStore } from "../modules/state/index.js";
import { InMemoryRunStore } from "../infrastructure/persistence/index.js";
import { InMemoryEventStore } from "../infrastructure/persistence/index.js";
import { UuidIdGenerator, type IdGenerator } from "../infrastructure/index.js";
import { SystemClock } from "../infrastructure/index.js";
import type { AppConfig } from "./config.js";
import { readEnvironmentConfig } from "../infrastructure/config/environment-config.js";
import { DefaultApplication } from "./application.js";
import { EmptyRetriever } from "../modules/retrieval/index.js";
import { createPlanningOrchestrator } from "../modules/planning/index.js";
import type { PlanningPipeline } from "../modules/planning/index.js";

export interface AppContainerOptions {
  readonly config?: AppConfig;
  readonly runtime?: AgentRuntime;
  readonly harness?: Harness;
  readonly stateStore?: StateStore;
  readonly eventSink?: EventSink;
  readonly idGenerator?: IdGenerator;
  readonly planning?: PlanningPipeline;
}

export const createApplication = (options: AppContainerOptions = {}): DefaultApplication => {
  const config = options.config ?? readEnvironmentConfig();
  const stateStore = options.stateStore ?? new InMemoryRunStore();
  const eventSink = options.eventSink ?? new InMemoryEventStore();
  const harness = options.harness ?? new DefaultHarness(config.execution);
  const runtime = options.runtime ?? new DefaultAgentRuntime(new DemoModelGateway(), harness);
  return new DefaultApplication(config, {
    runtime,
    harness,
    stateStore,
    eventSink,
    idGenerator: options.idGenerator ?? new UuidIdGenerator(),
    clock: new SystemClock(),
    planning: options.planning ?? createPlanningOrchestrator(new EmptyRetriever()),
  });
};
