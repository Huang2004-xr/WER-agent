import type { DeliverablePlan, PlanningBrief, ProposalDocument } from "@wer/shared";
import type { DeliverablePlanner } from "./types.js";

const QUESTION_BY_FIELD = {
  audience: "目标受众是谁？",
  deadline: "期望何时完成或上线？",
  channels: "计划使用哪些渠道？",
} as const;

export class StandardDeliverablePlanner implements DeliverablePlanner {
  plan(brief: PlanningBrief, _proposal: ProposalDocument): DeliverablePlan {
    return {
      format: "proposal",
      sections: ["提案摘要", "策略依据", "创意方向", "渠道执行清单", "风险与下一步"],
      acceptanceCriteria: [
        "每个策略判断都能追溯到 Brief 或研究证据",
        "每个创意方向都包含核心信息和渠道执行方式",
        "提案明确列出待确认事项与下一步行动",
      ],
      openQuestions: brief.missingFields.map((field) => QUESTION_BY_FIELD[field]),
    };
  }
}
