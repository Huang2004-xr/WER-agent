import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { EmptyRetriever, type Retriever } from "../retrieval/index.js";
import {
  BasicPlanningModule,
  PlanningOrchestrator,
  StandardBriefParser,
  StandardCreativeBuilder,
  StandardDeliverablePlanner,
  StandardProposalAssembler,
  StandardResearchPlanner,
  StandardStrategyBuilder,
} from "./index.js";

const createPipeline = (retriever: Retriever = new EmptyRetriever()): PlanningOrchestrator =>
  new PlanningOrchestrator({
    briefParser: new StandardBriefParser(),
    researchPlanner: new StandardResearchPlanner(retriever),
    strategyBuilder: new StandardStrategyBuilder(),
    creativeBuilder: new StandardCreativeBuilder(),
    proposalAssembler: new StandardProposalAssembler(),
    deliverablePlanner: new StandardDeliverablePlanner(),
  });

describe("planning pipeline", () => {
  test("把策划需求串成可交付的完整方案", async () => {
    const result = await createPipeline().createPlan({
      requirement: "为春季新品制定小红书和微信的品牌传播方案",
      client: "示例品牌",
      audience: "一二线城市 18-30 岁女性",
      deadline: "2026-03-15",
      channels: ["小红书", "微信"],
      constraints: ["预算有限", "需要两周内完成首轮提案"],
    });

    assert.match(result.brief.objective, /春季新品/);
    assert.deepEqual(result.brief.missingFields, []);
    assert.ok(result.research.questions.length > 0);
    assert.equal(result.strategy.audience, "一二线城市 18-30 岁女性");
    assert.ok(result.creativeDirections.length > 0);
    assert.ok(result.proposal.sections.includes("执行方案"));
    assert.ok(result.deliverable.acceptanceCriteria.length > 0);
  });

  test("对关键输入缺失给出可行动的待确认项", async () => {
    const result = await createPipeline().createPlan({ requirement: "做一个品牌活动" });

    assert.deepEqual(result.brief.missingFields, ["audience", "deadline", "channels"]);
    assert.deepEqual(result.deliverable.openQuestions, ["目标受众是谁？", "期望何时完成或上线？", "计划使用哪些渠道？"]);
  });

  test("把研究检索结果保留来源并传入策略洞察", async () => {
    const retriever: Retriever = {
      async search() {
        return [{ source: "research://trend-1", content: "目标人群更重视真实体验", score: 0.91 }];
      },
    };

    const result = await createPipeline(retriever).createPlan({
      requirement: "制定护肤品牌内容策略",
      audience: "年轻职场人",
      deadline: "2026-04-01",
      channels: ["小红书"],
    });

    assert.deepEqual(result.research.findings, [
      { source: "research://trend-1", content: "目标人群更重视真实体验", score: 0.91 },
    ]);
    assert.ok(result.strategy.insights.includes("目标人群更重视真实体验"));
  });

  test("保留原有的简要 Brief 创建接口", () => {
    assert.deepEqual(new BasicPlanningModule().createBrief("提升品牌认知"), {
      objective: "提升品牌认知",
      channels: [],
      constraints: [],
      missingFields: ["audience", "deadline", "channels"],
    });
  });
});
