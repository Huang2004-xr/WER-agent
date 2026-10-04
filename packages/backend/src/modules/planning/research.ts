import type { PlanningBrief, ResearchPlan } from "@wer/shared";
import type { Retriever } from "../retrieval/index.js";
import type { ResearchPlanner } from "./types.js";

export class StandardResearchPlanner implements ResearchPlanner {
  public constructor(private readonly retriever: Retriever) {}

  async createPlan(brief: PlanningBrief): Promise<ResearchPlan> {
    const questions = [
      { question: `${brief.objective}的核心竞争环境是什么？`, purpose: "识别市场与竞品背景" },
      { question: `${brief.audience ?? "目标受众"}最在意什么？`, purpose: "确认受众动机与阻力" },
      { question: "哪些内容证据可以支持方案判断？", purpose: "建立可验证的策略依据" },
    ];
    const findings = await this.retriever.search(brief.objective);

    return {
      questions,
      findings,
      status: findings.length > 0 ? "ready" : "needs-research",
    };
  }
}
