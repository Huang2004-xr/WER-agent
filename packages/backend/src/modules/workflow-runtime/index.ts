export interface WorkflowStep { readonly id: string; readonly name: string; }
export interface WorkflowDefinition { readonly name: string; readonly steps: readonly WorkflowStep[]; }

export class WorkflowRegistry {
  private readonly workflows = new Map<string, WorkflowDefinition>();
  register(workflow: WorkflowDefinition): void { this.workflows.set(workflow.name, workflow); }
  get(name: string): WorkflowDefinition | undefined { return this.workflows.get(name); }
}
