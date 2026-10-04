export interface SkillDefinition {
  readonly name: string;
  readonly description: string;
  readonly toolNames: readonly string[];
}

export class SkillRegistry {
  private readonly skills = new Map<string, SkillDefinition>();
  register(skill: SkillDefinition): void { this.skills.set(skill.name, skill); }
  list(): readonly SkillDefinition[] { return [...this.skills.values()]; }
}
