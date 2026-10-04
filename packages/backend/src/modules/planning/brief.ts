import type { PlanningBrief, PlanningInput } from "@wer/shared";
import type { BriefParser } from "./types.js";

const KNOWN_CHANNELS = ["小红书", "微信", "抖音", "微博", "B站", "线下活动"] as const;

const clean = (value: string | undefined): string | undefined => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

const unique = (values: readonly string[]): readonly string[] => [...new Set(values.map((value) => value.trim()).filter(Boolean))];

export class StandardBriefParser implements BriefParser {
  parse(input: PlanningInput): PlanningBrief {
    const objective = input.requirement.trim();
    const client = clean(input.client);
    const audience = clean(input.audience);
    const budget = clean(input.budget);
    const deadline = clean(input.deadline);
    const channels = unique([
      ...(input.channels ?? []),
      ...KNOWN_CHANNELS.filter((channel) => objective.includes(channel)),
    ]);
    const constraints = unique(input.constraints ?? []);
    const missingFields = [
      ...(!audience ? (["audience"] as const) : []),
      ...(!deadline ? (["deadline"] as const) : []),
      ...(channels.length === 0 ? (["channels"] as const) : []),
    ];

    return {
      objective,
      channels,
      constraints,
      missingFields,
      ...(client ? { client: client! } : {}),
      ...(audience ? { audience: audience! } : {}),
      ...(budget ? { budget: budget! } : {}),
      ...(deadline ? { deadline: deadline! } : {}),
    };
  }
}
