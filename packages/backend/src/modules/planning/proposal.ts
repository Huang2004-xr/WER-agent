import type {
  CreativeDirection,
  PlanningBrief,
  ProposalDocument,
  ResearchPlan,
  StrategyPlan,
} from "@wer/shared";
import type { ProposalAssembler } from "./types.js";

export class StandardProposalAssembler implements ProposalAssembler {
  assemble(
    brief: PlanningBrief,
    research: ResearchPlan,
    strategy: StrategyPlan,
    creativeDirections: readonly CreativeDirection[],
  ): ProposalDocument {
    return {
      title: `${brief.client ? `${brief.client}｜` : ""}${brief.objective}策划提案`,
      sections: ["项目 Brief", "研究问题与证据", "策略判断", "创意方向", "执行方案", "风险与待确认事项"],
      brief,
      research,
      strategy,
      creativeDirections,
    };
  }
}
