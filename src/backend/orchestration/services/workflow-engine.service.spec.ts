import { WorkflowEngineService } from './workflow-engine.service';

describe('WorkflowEngineService queue orchestration', () => {
  const queue = { add: jest.fn() } as any;
  const events = { publish: jest.fn() } as any;
  const intent = { recognize: jest.fn().mockReturnValue('general.chat') } as any;
  const routing = { route: jest.fn().mockReturnValue('general_assistant') } as any;
  const execution = { execute: jest.fn().mockResolvedValue({ ok: true }) } as any;
  const storage = { logStage: jest.fn().mockResolvedValue(undefined) } as any;
  const aiGateway = { generateText: jest.fn().mockResolvedValue('hello') } as any;

  const svc = new WorkflowEngineService(
    queue,
    events,
    intent,
    routing,
    execution,
    storage,
    aiGateway,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enqueues intent stage with deterministic job id', async () => {
    await svc.start({
      organizationId: 'org_1',
      externalUserId: 'u_ext',
      channel: 'telegram',
      correlationId: 'corr_1',
      message: 'hello',
    });

    expect(queue.add).toHaveBeenCalledWith(
      'workflow.intent',
      expect.objectContaining({ stage: 'intent', correlationId: 'corr_1' }),
      expect.objectContaining({ jobId: 'corr_1:intent' }),
    );
  });

  it('moves from intent stage to route stage with stable ids', async () => {
    await svc.runStage({
      stage: 'intent',
      organizationId: 'org_1',
      externalUserId: 'u_ext',
      channel: 'telegram',
      correlationId: 'corr_2',
      message: 'need help',
    });

    expect(queue.add).toHaveBeenCalledWith(
      'workflow.route',
      expect.objectContaining({ stage: 'route', correlationId: 'corr_2', intent: 'general.chat' }),
      expect.objectContaining({ jobId: 'corr_2:route' }),
    );
  });
});
