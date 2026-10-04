import type { CreativeDirection, PlanningBrief, StrategyPlan } from "@wer/shared";
import type { CreativeBuilder } from "./types.js";

export class StandardCreativeBuilder implements CreativeBuilder {
  build(strategy: StrategyPlan, brief: PlanningBrief): readonly CreativeDirection[] {
    const channels = brief.channels.length > 0 ? brief.channels : ["待确认渠道"];
    return [
      {
        name: "真实体验叙事",
        concept: `把${strategy.audience}的真实场景变成内容主线`,
        message: strategy.insights[0] ?? strategy.positioning,
        executions: channels.map((channel) => `${channel}：围绕真实体验设计内容单元`),
      },
      {
        name: "行动理由表达",
        concept: "用清晰的利益点降低受众决策成本",
        message: strategy.positioning,
        executions: channels.map((channel) => `${channel}：设计从认知到行动的转化路径`),
      },
    ];
  }
}
