import type {
  CreativeDirection,
  DeliverablePlan,
  PlanningBrief,
  PlanningInput,
  PlanningResult,
  ProposalDocument,
  ResearchPlan,
  StrategyPlan,
} from "@wer/shared";

export interface BriefParser {
  parse(input: PlanningInput): PlanningBrief;
}

export interface ResearchPlanner {
  createPlan(brief: PlanningBrief): Promise<ResearchPlan>;
}

export interface StrategyBuilder {
  build(brief: PlanningBrief, research: ResearchPlan): StrategyPlan;
}

export interface CreativeBuilder {
  build(strategy: StrategyPlan, brief: PlanningBrief): readonly CreativeDirection[];
}

export interface ProposalAssembler {
  assemble(
    brief: PlanningBrief,
    research: ResearchPlan,
    strategy: StrategyPlan,
    creativeDirections: readonly CreativeDirection[],
  ): ProposalDocument;
}

export interface DeliverablePlanner {
  plan(brief: PlanningBrief, proposal: ProposalDocument): DeliverablePlan;
}

export interface PlanningPipeline {
  createPlan(input: PlanningInput): Promise<PlanningResult>;
}
