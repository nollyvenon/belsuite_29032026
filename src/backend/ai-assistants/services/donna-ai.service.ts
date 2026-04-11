/**
 * DonnaAI — Operations Manager Assistant
 *
 * Handles:
 *   - Conversational ops management
 *   - Workflow creation & execution
 *   - Campaign management
 *   - Task distribution & tracking
 *
 * Uses balanced routing — speed matters for operations.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '../../common/events/event.bus';
import { PrismaService }                from '../../database/prisma.service';
import { AIGatewayService }             from '../../ai-gateway/ai-gateway.service';
import { GatewayTask }                  from '../../ai-gateway/types/gateway.types';
import type { ConversationMessage } from '../../ai-gateway/types/gateway.types';
import { ConversationMemoryService }    from '../memory/conversation-memory.service';
import { TaskExecutionEngine }          from '../engine/task-execution.engine';
import {
  ChatRequest, ChatResponse,
  WorkflowSpec, CampaignSpec, SubmittedTask,
} from '../types/assistant.types';

const DONNA_SYSTEM = `You are DonnaAI, the operations manager AI for BelSuite.
You execute, coordinate, and automate marketing operations so the user never has to do it manually.

Your capabilities:
- Create and trigger workflows
- Schedule and manage campaigns
- Queue social media posts and email sequences
- Track task completion
- Identify workflow bottlenecks and suggest improvements

Personality: efficient, proactive, detail-oriented. Lead with action items.
When the user asks you to DO something, confirm the action, queue it, and report back.
Use bullet points and numbered lists to keep things scannable.`;

@Injectable()
export class DonnaAIService {
  private readonly logger = new Logger(DonnaAIService.name);

  constructor(
    private readonly prisma:   PrismaService,
    private readonly gateway:  AIGatewayService,
    private readonly memory:   ConversationMemoryService,
    private readonly tasks:    TaskExecutionEngine,
    private readonly eventBus: EventBus,
  ) {}

  // ── Chat ───────────────────────────────────────────────────────────────

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const { organizationId, userId, message } = req;

    const conversationId = await this.memory.getOrCreateConversation(
      organizationId, 'DONNA', req.conversationId, userId,
    );

    await this.memory.addMessage(conversationId, 'user', message);

    const contextPrompt = await this.memory.buildContextPrompt(organizationId, 'DONNA');
    const systemPrompt  = contextPrompt
      ? `${DONNA_SYSTEM}\n\n${contextPrompt}`
      : DONNA_SYSTEM;

    const history = await this.memory.getHistory(conversationId);

    const conversationHistory: ConversationMessage[] = history
      .filter((m) => m.role === 'user' || m.role === 'assistant' || m.role === 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }));

    const response = await this.gateway.generate({
      organizationId,
      userId,
      task:    GatewayTask.BUSINESS_INSIGHTS,
      feature: 'donna_chat',
      prompt:  message,
      systemPrompt,
      maxTokens: 1200,
      routing: { strategy: 'balanced' },
      conversationHistory,
    });

    const messageId = await this.memory.addMessage(
      conversationId,
      'assistant',
      response.text,
      { model: response.model, costUsd: response.costUsd },
    );

    await this.persistAssistantEvent(organizationId, userId, 'donna.chat.replied', {
      conversationId,
      messageId,
      reply: response.text,
      model: response.model,
    });

    // Detect implicit task intents and auto-queue them
    const submittedTasks = await this.detectAndQueueTasks(
      organizationId, userId, message, response.text,
    );

    return {
      conversationId,
      messageId,
      reply:      response.text,
      model:      response.model,
      tokensUsed: response.tokens.total,
      costUsd:    response.costUsd,
      tasks:      submittedTasks,
    };
  }

  // ── Workflow automation ────────────────────────────────────────────────

  async designWorkflow(
    organizationId: string,
    description:    string,
    trigger:        string,
  ): Promise<WorkflowSpec> {
    const prompt = `Design an automated marketing workflow based on this description.

Trigger event: "${trigger}"
Description: "${description}"

Return a JSON object (no markdown fences):
{
  "name": string,
  "trigger": string,
  "steps": [{ "action": string, "params": object|null, "delayMinutes": number|null }]
}
Include 4-8 concrete steps. Actions must be executable (send_email, post_social, tag_lead, notify_team, etc.)`;

    const raw = await this.gateway.generateText(
      organizationId,
      GatewayTask.BUSINESS_INSIGHTS,
      'donna_workflow',
      prompt,
      { maxTokens: 1500, routing: { strategy: 'balanced' } },
    );

    return this.parseJSON<WorkflowSpec>(raw, { name: 'Workflow', trigger, steps: [] });
  }

  async executeWorkflow(
    organizationId: string,
    userId:         string | undefined,
    workflowSpec:   WorkflowSpec,
  ): Promise<SubmittedTask> {
    const submitted = await this.tasks.submit({
      organizationId,
      userId,
      assistantType: 'DONNA',
      taskType:      'RUN_WORKFLOW',
      data:          { workflow: workflowSpec },
    });
    await this.persistAssistantEvent(organizationId, userId, 'donna.workflow.queued', {
      workflow: workflowSpec,
      taskId: submitted.taskId,
    });
    return submitted;
  }

  // ── Campaign management ────────────────────────────────────────────────

  async createCampaign(
    organizationId: string,
    userId:         string | undefined,
    spec:           CampaignSpec,
  ): Promise<{ campaign: any; tasks: SubmittedTask[] }> {
    // Persist campaign to DB
    const campaign = await this.prisma.marketingCampaign.create({
      data: {
        organizationId,
        name:          spec.name,
        description:   spec.goal,
        type:          'MULTI_CHANNEL',
        status:        'DRAFT',
        startDate:     spec.startDate,
        endDate:       spec.endDate ?? null,
        budget:        spec.budget ?? null,
        targetAudience: spec.audience,
        channels:      spec.channels,
        goals:         [spec.goal],
      } as any,
    });

    // Queue content generation tasks for each channel
    const submittedTasks: SubmittedTask[] = [];
    for (const channel of spec.channels) {
      const t = await this.tasks.submit({
        organizationId,
        userId,
        assistantType: 'DONNA',
        taskType:      'PLAN_CAMPAIGN',
        data:          { campaignId: campaign.id, channel, spec },
      }, { priority: 3 });
      submittedTasks.push(t);
    }

    await this.persistAssistantEvent(organizationId, userId, 'donna.campaign.created', {
      campaignId: campaign.id,
      name: spec.name,
      channels: spec.channels,
      tasks: submittedTasks.map((task) => task.taskId),
    });

    await this.prisma.activity.create({
      data: {
        organizationId,
        title: `Campaign created: ${spec.name}`,
        description: spec.goal,
        aiGenerated: true,
        sourceEventType: 'donna.campaign.created',
        sourceEventId: campaign.id,
      } as any,
    });

    return { campaign, tasks: submittedTasks };
  }

  async getCampaignStatus(organizationId: string, campaignId: string) {
    const [campaign, tasks] = await Promise.all([
      this.prisma.marketingCampaign.findFirst({
        where: { id: campaignId, organizationId },
      }),
      this.tasks.getOrgTasks(organizationId, { assistantType: 'DONNA' }),
    ]);

    const campaignTasks = tasks.filter(
      t => (t.payload as any)?.campaignId === campaignId,
    );

    return { campaign, tasks: campaignTasks };
  }

  // ── Task intelligence ──────────────────────────────────────────────────

  async prioritizeTasks(
    organizationId: string,
    taskDescriptions: string[],
  ): Promise<Array<{ task: string; priority: number; reason: string }>> {
    const prompt = `Prioritise these tasks for a marketing team. Consider urgency, impact, and dependencies.

Tasks:
${taskDescriptions.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Return a JSON array (no markdown fences):
[{ "task": string, "priority": 1-10, "reason": string }]
Higher number = higher priority.`;

    const raw = await this.gateway.generateText(
      organizationId,
      GatewayTask.CLASSIFICATION,
      'donna_prioritise',
      prompt,
      { maxTokens: 1000, routing: { strategy: 'fastest' } },
    );

    return this.parseJSON<Array<{ task: string; priority: number; reason: string }>>(raw, []);
  }

  // ── Private helpers ────────────────────────────────────────────────────

  /**
   * Light intent detection — if the user's message contains clear action verbs
   * (schedule, post, send, create), queue the appropriate task automatically.
   */
  private async detectAndQueueTasks(
    organizationId: string,
    userId:         string | undefined,
    userMessage:    string,
    aiReply:        string,
  ): Promise<SubmittedTask[]> {
    const submitted: SubmittedTask[] = [];
    const lower = userMessage.toLowerCase();

    if (lower.includes('schedule') && lower.includes('campaign')) {
      const t = await this.tasks.submit({
        organizationId, userId,
        assistantType: 'DONNA',
        taskType: 'PLAN_CAMPAIGN',
        data: { source: 'auto_detect', userMessage, aiReply },
      }, { priority: 5 });
      submitted.push(t);
    }

    if (lower.includes('deal') || lower.includes('crm')) {
      await this.persistAssistantEvent(organizationId, userId, 'donna.crm.suggestion', {
        userMessage,
        aiReply,
      });
    }

    return submitted;
  }

  private async persistAssistantEvent(
    organizationId: string,
    userId: string | undefined,
    type: string,
    data: Record<string, unknown>,
  ) {
    await this.eventBus.publish({
      id: `${type}-${Date.now()}`,
      type,
      tenantId: organizationId,
      userId,
      data,
      timestamp: new Date(),
      correlationId: `${organizationId}-${Date.now()}`,
      version: 1,
      metadata: {
        environment: process.env['NODE_ENV'] ?? 'development',
        service: 'donna-ai',
      },
    });
  }

  private parseJSON<T>(raw: string, fallback: T): T {
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned) as T;
    } catch {
      this.logger.warn('Failed to parse Donna JSON response');
      return fallback;
    }
  }
}
