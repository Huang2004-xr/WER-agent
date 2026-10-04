import type { PlanningBrief, PlanningInput, PlanningResult } from "@wer/shared";
import { StandardBriefParser } from "./brief.js";
import { StandardCreativeBuilder } from "./creative.js";
import { StandardDeliverablePlanner } from "./deliverable.js";
import { StandardProposalAssembler } from "./proposal.js";
import { StandardResearchPlanner } from "./research.js";
import { StandardStrategyBuilder } from "./strategy.js";
import type {
  BriefParser,
  CreativeBuilder,
  DeliverablePlanner,
  PlanningPipeline,
  ProposalAssembler,
  ResearchPlanner,
  StrategyBuilder,
} from "./types.js";
import type { Retriever } from "../retrieval/index.js";

export * from "./brief.js";
export * from "./creative.js";
export * from "./deliverable.js";
export * from "./proposal.js";
export * from "./research.js";
export * from "./strategy.js";
export * from "./types.js";

export interface PlanningModule {
  createBrief(input: string): PlanningBrief;
}

export class BasicPlanningModule implements PlanningModule {
  public constructor(private readonly parser: BriefParser = new StandardBriefParser()) {}

  createBrief(input: string): PlanningBrief {
    return this.parser.parse({ requirement: input });
  }
}

export interface PlanningDependencies {
  readonly briefParser: BriefParser;
  readonly researchPlanner: ResearchPlanner;
  readonly strategyBuilder: StrategyBuilder;
  readonly creativeBuilder: CreativeBuilder;
  readonly proposalAssembler: ProposalAssembler;
  readonly deliverablePlanner: DeliverablePlanner;
}

export class PlanningOrchestrator implements PlanningPipeline {
  public constructor(private readonly dependencies: PlanningDependencies) {}

  async createPlan(input: PlanningInput): Promise<PlanningResult> {
    const brief = this.dependencies.briefParser.parse(input);
    const research = await this.dependencies.researchPlanner.createPlan(brief);
    const strategy = this.dependencies.strategyBuilder.build(brief, research);
    const creativeDirections = this.dependencies.creativeBuilder.build(strategy, brief);
    const proposal = this.dependencies.proposalAssembler.assemble(
      brief,
      research,
      strategy,
      creativeDirections,
    );
    const deliverable = this.dependencies.deliverablePlanner.plan(brief, proposal);

    return { brief, research, strategy, creativeDirections, proposal, deliverable };
  }
}

export const createPlanningOrchestrator = (retriever: Retriever): PlanningOrchestrator =>
  new PlanningOrchestrator({
    briefParser: new StandardBriefParser(),
    researchPlanner: new StandardResearchPlanner(retriever),
    strategyBuilder: new StandardStrategyBuilder(),
    creativeBuilder: new StandardCreativeBuilder(),
    proposalAssembler: new StandardProposalAssembler(),
    deliverablePlanner: new StandardDeliverablePlanner(),
  });
