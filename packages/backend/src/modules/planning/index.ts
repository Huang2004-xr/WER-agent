export interface PlanningBrief { readonly objective: string; readonly audience?: string; readonly constraints?: readonly string[]; }
export interface PlanningModule { createBrief(input: string): PlanningBrief; }

export class BasicPlanningModule implements PlanningModule {
  createBrief(input: string): PlanningBrief { return { objective: input }; }
}
