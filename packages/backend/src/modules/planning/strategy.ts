import type { PlanningBrief, ResearchPlan, StrategyPlan } from "@wer/shared";
import type { StrategyBuilder } from "./types.js";

export class StandardStrategyBuilder implements StrategyBuilder {
  build(brief: PlanningBrief, research: ResearchPlan): StrategyPlan {
    const audience = brief.audience ?? "待确认目标受众";
    const insights = research.findings.length > 0
      ? research.findings.map((finding) => finding.content)
      : ["当前缺少外部研究证据，需在提案前补充验证"];

    return {
      problem: `需要解决“${brief.objective}”对应的业务与传播问题`,
      goal: brief.objective,
      audience,
      positioning: `围绕${audience}的真实需求，建立可被理解和行动的品牌表达`,
      insights,
      directions: ["以受众需求为起点组织信息", "用可验证的内容证据支撑传播判断"],
    };
  }
}
