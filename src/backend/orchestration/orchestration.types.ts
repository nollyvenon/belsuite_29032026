export const ORCHESTRATION_QUEUE = 'orchestration-workflows';

export type WorkflowStage =
  | 'intent'
  | 'route'
  | 'execute'
  | 'store'
  | 'respond';

export interface OrchestrationJobPayload {
  stage: WorkflowStage;
  organizationId: string;
  userId?: string;
  externalUserId: string;
  channel: string;
  correlationId: string;
  message: string;
  locale?: string;
  metadata?: Record<string, any>;
  intent?: string;
  task?: string;
  serviceResult?: Record<string, any>;
}
