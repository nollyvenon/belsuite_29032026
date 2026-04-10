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
import { PrismaService }                from '../../database/prisma.service';
import { AIGatewayService }             from '../../ai-gateway/ai-gateway.service';
import { GatewayTask }                  from '../../ai-gateway/types/gateway.types';
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

    const response = await this.gateway.generate({
      organizationId,
      userId,
      task:    GatewayTask.BUSINESS_INSIGHTS,
      feature: 'donna_chat',
      prompt:  message,
      systemPrompt,
      maxTokens: 1200,
      routing: { strategy: 'balanced' },
      conversationHistory: history.filter(m => m.role !== 'system'),
    });

    const messageId = await this.memory.addMessage(
      conversationId,
      'assistant',
      response.text,
      { model: response.model, costUsd: response.costUsd },
    );

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
    return this.tasks.submit({
      organizationId,
      userId,
      assistantType: 'DONNA',
      taskType:      'RUN_WORKFLOW',
      data:          { workflow: workflowSpec },
    });
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

    return submitted;
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
