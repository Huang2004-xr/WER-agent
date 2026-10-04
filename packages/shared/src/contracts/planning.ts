export interface PlanningInput {
  readonly requirement: string;
  readonly client?: string;
  readonly audience?: string;
  readonly budget?: string;
  readonly deadline?: string;
  readonly channels?: readonly string[];
  readonly constraints?: readonly string[];
}

export interface PlanningRequest extends PlanningInput {
  readonly sessionId: string;
  readonly requestId?: string;
  readonly idempotencyKey?: string;
}

export type PlanningBriefField = "audience" | "deadline" | "channels";

export interface PlanningBrief {
  readonly objective: string;
  readonly client?: string;
  readonly audience?: string;
  readonly budget?: string;
  readonly deadline?: string;
  readonly channels: readonly string[];
  readonly constraints: readonly string[];
  readonly missingFields: readonly PlanningBriefField[];
}

export interface ResearchQuestion {
  readonly question: string;
  readonly purpose: string;
}

export interface ResearchFinding {
  readonly source: string;
  readonly content: string;
  readonly score: number;
}

export interface ResearchPlan {
  readonly questions: readonly ResearchQuestion[];
  readonly findings: readonly ResearchFinding[];
  readonly status: "ready" | "needs-research";
}

export interface StrategyPlan {
  readonly problem: string;
  readonly goal: string;
  readonly audience: string;
  readonly positioning: string;
  readonly insights: readonly string[];
  readonly directions: readonly string[];
}

export interface CreativeDirection {
  readonly name: string;
  readonly concept: string;
  readonly message: string;
  readonly executions: readonly string[];
}

export interface ProposalDocument {
  readonly title: string;
  readonly sections: readonly string[];
  readonly brief: PlanningBrief;
  readonly research: ResearchPlan;
  readonly strategy: StrategyPlan;
  readonly creativeDirections: readonly CreativeDirection[];
}

export interface DeliverablePlan {
  readonly format: "proposal";
  readonly sections: readonly string[];
  readonly acceptanceCriteria: readonly string[];
  readonly openQuestions: readonly string[];
}

export interface PlanningResult {
  readonly brief: PlanningBrief;
  readonly research: ResearchPlan;
  readonly strategy: StrategyPlan;
  readonly creativeDirections: readonly CreativeDirection[];
  readonly proposal: ProposalDocument;
  readonly deliverable: DeliverablePlan;
}

export interface PlanningResponse {
  readonly runId: string;
  readonly status: "completed";
  readonly result: PlanningResult;
}
