import { createHmac, randomUUID } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WorkflowType } from '@prisma/client';
import { EventBus } from '../common/events/event.bus';
import { AIService } from '../ai/ai.service';
import { AIModel } from '../ai/types/ai.types';
import { PrismaService } from '../database/prisma.service';
import {
  AbTestVariantDto,
  AUTOMATION_CHANNELS,
  CampaignContactDto,
  CampaignStepDto,
  CreateMarketingAutomationCampaignDto,
  GenerateMarketingCopyDto,
  LaunchCampaignDto,
  MarketingAutomationListQueryDto,
  OptimizeSendTimeDto,
  TriggerWorkflowEventDto,
  UpdateMarketingAutomationCampaignDto,
  AutoOptimizeAbTestDto,
  TwilioStatusCallbackDto,
} from './dto/marketing-automation.dto';
import {
  MARKETING_AUTOMATION_QUEUE,
  MarketingAutomationJobPayload,
} from './processors/marketing-automation.processor';

@Injectable()
export class MarketingAutomationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    @InjectQueue(MARKETING_AUTOMATION_QUEUE) private readonly queue: Queue,
    private readonly eventBus: EventBus,
  ) {}

  async createCampaign(
    organizationId: string,
    userId: string,
    dto: CreateMarketingAutomationCampaignDto,
  ) {
    const audience = await this.buildAudienceFromContext(organizationId, dto.audience || {});
    const workflow = await this.prisma.workflow.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description,
        type: this.determineWorkflowType(dto.trigger.mode, dto.steps || []),
        trigger: JSON.stringify({
          engine: 'marketing_automation',
          objective: dto.objective,
          trigger: dto.trigger,
          audience,
          personalizationFields: dto.personalizationFields || [],
          abTestSettings: dto.abTestSettings || {},
          optimizeSendTime: dto.optimizeSendTime || false,
          builder: {
            nodes: dto.builderNodes || [],
            edges: dto.builderEdges || [],
          },
          channels: this.extractChannels(dto.steps || []),
          createdById: userId,
        }),
        isActive: false,
        actions: {
          create: (dto.steps || []).map((step, index) => ({
            order: index + 1,
            actionType: `marketing.${step.channel}`,
            config: JSON.stringify(step),
          })),
        },
      },
      include: { actions: { orderBy: { order: 'asc' } } },
    });

    await this.eventBus.publish({
      id: `marketing-campaign-created-${workflow.id}`,
      type: 'marketing.campaign.created',
      tenantId: organizationId,
      userId,
      data: {
        campaignId: workflow.id,
        name: workflow.name,
        objective: dto.objective,
        channels: this.extractChannels(dto.steps || []),
      },
      timestamp: new Date(),
      correlationId: workflow.id,
      version: 1,
      metadata: {
        environment: process.env['NODE_ENV'] ?? 'development',
        service: 'marketing-automation',
      },
    });

    return this.mapCampaign(workflow);
  }

  async listCampaigns(organizationId: string, query: MarketingAutomationListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const items = await this.prisma.workflow.findMany({
      where: {
        organizationId,
        type: { in: [WorkflowType.SEQUENCE, WorkflowType.TRIGGER_BASED, WorkflowType.CONDITIONAL] },
      },
      include: { actions: { orderBy: { order: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
      take: limit * 3,
      skip: 0,
    });

    const filtered = items
      .map((workflow) => this.mapCampaign(workflow))
      .filter((campaign) => {
        if (campaign.engine !== 'marketing_automation') return false;
        const statusOk = query.status
          ? query.status === 'active'
            ? campaign.isActive
            : !campaign.isActive
          : true;
        const triggerOk = query.triggerMode ? campaign.trigger.mode === query.triggerMode : true;
        const q = query.q?.toLowerCase();
        const searchOk = q
          ? JSON.stringify(campaign).toLowerCase().includes(q)
          : true;
        return statusOk && triggerOk && searchOk;
      });

    return {
      items: filtered.slice(skip, skip + limit),
      page,
      limit,
      total: filtered.length,
    };
  }

  async getCampaign(organizationId: string, campaignId: string) {
    const workflow = await this.getCampaignWorkflow(organizationId, campaignId);
    return this.mapCampaign(workflow);
  }

  async updateCampaign(
    organizationId: string,
    campaignId: string,
    dto: UpdateMarketingAutomationCampaignDto,
  ) {
    const existing = await this.getCampaignWorkflow(organizationId, campaignId);
    const existingTrigger = this.parseJson(existing.trigger);

    await this.prisma.$transaction(async (tx) => {
      await tx.workflow.update({
        where: { id: campaignId },
        data: {
          name: dto.name,
          description: dto.description,
          type: dto.trigger
            ? this.determineWorkflowType(dto.trigger.mode, dto.steps || this.parseSteps(existing.actions))
            : undefined,
          isActive: dto.isActive,
          trigger: JSON.stringify({
            ...existingTrigger,
            objective: dto.objective ?? existingTrigger.objective,
            trigger: dto.trigger ?? existingTrigger.trigger,
            audience: dto.audience ? await this.buildAudienceFromContext(organizationId, dto.audience) : existingTrigger.audience,
            personalizationFields: dto.personalizationFields ?? existingTrigger.personalizationFields,
            abTestSettings: dto.abTestSettings ?? existingTrigger.abTestSettings,
            optimizeSendTime:
              dto.optimizeSendTime !== undefined ? dto.optimizeSendTime : existingTrigger.optimizeSendTime,
            builder: {
              nodes: dto.builderNodes ?? existingTrigger.builder?.nodes ?? [],
              edges: dto.builderEdges ?? existingTrigger.builder?.edges ?? [],
            },
            channels: this.extractChannels(dto.steps || this.parseSteps(existing.actions)),
          }),
        },
      });

      if (dto.steps) {
        await tx.workflowAction.deleteMany({ where: { workflowId: campaignId } });
        if (dto.steps.length > 0) {
          await tx.workflowAction.createMany({
            data: dto.steps.map((step, index) => ({
              workflowId: campaignId,
              order: index + 1,
              actionType: `marketing.${step.channel}`,
              config: JSON.stringify(step),
            })),
          });
        }
      }
    });

    return this.getCampaign(organizationId, campaignId);
  }

  private async buildAudienceFromContext(organizationId: string, audience: Record<string, unknown>) {
    const payload = { ...audience };
    const leadScore = this.readNumber(payload.leadScore);
    const minScore = leadScore ?? 0;
    const segments = Array.isArray(payload.segments) ? payload.segments : [];

    const crmSegments = await this.prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        eventType: { in: ['crm.lead.imported', 'crm.pipeline.stage_changed', 'crm.conversion.marked'] },
      },
      orderBy: { timestamp: 'desc' },
      take: 2000,
    });

    return {
      ...payload,
      minLeadScore: minScore,
      segments,
      crmSignals: crmSegments.map((event) => ({
        id: event.id,
        type: event.eventType,
        timestamp: event.timestamp,
      })),
    };
  }

  private readNumber(value: unknown): number | undefined {
    return typeof value === 'number' ? value : undefined;
  }

  async setCampaignActive(organizationId: string, campaignId: string, isActive: boolean) {
    await this.getCampaignWorkflow(organizationId, campaignId);
    const workflow = await this.prisma.workflow.update({
      where: { id: campaignId },
      data: { isActive },
      include: { actions: { orderBy: { order: 'asc' } } },
    });

    await this.eventBus.publish({
      id: `marketing-campaign-updated-${workflow.id}`,
      type: 'marketing.campaign.updated',
      tenantId: organizationId,
      userId,
      data: {
        campaignId: workflow.id,
        name: workflow.name,
        isActive,
      },
      timestamp: new Date(),
      correlationId: workflow.id,
      version: 1,
      metadata: {
        environment: process.env['NODE_ENV'] ?? 'development',
        service: 'marketing-automation',
      },
    });
    return this.mapCampaign(workflow);
  }

  async launchCampaign(
    organizationId: string,
    userId: string,
    campaignId: string,
    dto: LaunchCampaignDto,
  ) {
    const workflow = await this.getCampaignWorkflow(organizationId, campaignId);
    const campaign = this.mapCampaign(workflow);

    if (campaign.steps.length === 0) {
      throw new BadRequestException('Campaign must include at least one step');
    }

    const runId = randomUUID();
    const queued = await this.queueCampaignContacts(
      organizationId,
      userId,
      campaign,
      runId,
      dto.contacts,
      dto.respectOptimalSendTime || false,
    );

    await this.prisma.workflow.update({
      where: { id: campaignId },
      data: { executionCount: { increment: 1 }, lastExecutedAt: new Date() },
    });

    await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'marketing.automation.run_started',
        properties: JSON.stringify({
          campaignId,
          campaignName: campaign.name,
          runId,
          contacts: dto.contacts.length,
          queuedJobs: queued,
          startedAt: new Date().toISOString(),
        }),
      },
    });

    await this.eventBus.publish({
      id: `marketing-run-started-${runId}`,
      type: 'marketing.automation.run_started',
      tenantId: organizationId,
      userId,
      data: {
        campaignId,
        campaignName: campaign.name,
        runId,
        contacts: dto.contacts.length,
      },
      timestamp: new Date(),
      correlationId: runId,
      version: 1,
      metadata: {
        environment: process.env['NODE_ENV'] ?? 'development',
        service: 'marketing-automation',
      },
    });

    return {
      campaignId,
      runId,
      queuedJobs: queued,
      contacts: dto.contacts.length,
    };
  }

  async triggerEvent(organizationId: string, userId: string, dto: TriggerWorkflowEventDto) {
    const workflows = await this.prisma.workflow.findMany({
      where: {
        organizationId,
        isActive: true,
        type: WorkflowType.TRIGGER_BASED,
      },
      include: { actions: { orderBy: { order: 'asc' } } },
    });

    const matched = workflows
      .map((workflow) => this.mapCampaign(workflow))
      .filter(
        (campaign) =>
          campaign.engine === 'marketing_automation' && campaign.trigger.eventName === dto.eventName,
      );

    const results = [] as Array<Record<string, unknown>>;
    for (const campaign of matched) {
      const runId = randomUUID();
      const queued = await this.queueCampaignContacts(
        organizationId,
        userId,
        campaign,
        runId,
        [dto.contact],
        true,
        dto.metadata,
      );

      results.push({ campaignId: campaign.id, runId, queuedJobs: queued });

      await this.prisma.analyticsEvent.create({
        data: {
          organizationId,
          userId,
          eventType: 'marketing.automation.event_triggered',
          properties: JSON.stringify({
            campaignId: campaign.id,
            campaignName: campaign.name,
            eventName: dto.eventName,
            runId,
            contact: dto.contact,
            metadata: dto.metadata,
            triggeredAt: new Date().toISOString(),
          }),
        },
      });

      await this.eventBus.publish({
        id: `marketing-event-triggered-${runId}-${campaign.id}`,
        type: 'marketing.automation.event_triggered',
        tenantId: organizationId,
        userId,
        data: {
          campaignId: campaign.id,
          campaignName: campaign.name,
          eventName: dto.eventName,
          runId,
          contact: dto.contact,
          metadata: dto.metadata ?? {},
        },
        timestamp: new Date(),
        correlationId: runId,
        version: 1,
        metadata: {
          environment: process.env['NODE_ENV'] ?? 'development',
          service: 'marketing-automation',
        },
      });
    }

    return {
      eventName: dto.eventName,
      matchedCampaigns: matched.length,
      runs: results,
    };
  }

  async generateCopy(organizationId: string, userId: string, dto: GenerateMarketingCopyDto) {
    const variantCount = dto.variantCount ?? 3;
    const prompt = `You are an elite lifecycle marketing strategist.
Return strict JSON with keys: subjectLines, variants, sms, whatsapp, voiceScript, personalizationIdeas.
Objective: ${dto.objective}
Offer: ${dto.offer}
Audience: ${dto.audience}
Primary channel: ${dto.channel || 'email'}
Tone: ${dto.tone || 'persuasive'}
Generate ${variantCount} message variants.
Return valid JSON only.`;

    try {
      const result = await this.aiService.generateText(
        {
          prompt,
          model: AIModel.GPT_4_TURBO,
          temperature: 0.45,
          maxTokens: 900,
        },
        organizationId,
        userId,
        { type: 'best_quality' },
        true,
      );

      return this.safeJson(result.text);
    } catch {
      return {
        subjectLines: [
          `A faster way to ${dto.objective.toLowerCase()}`,
          `Quick idea for ${dto.audience}`,
          `Can we help with ${dto.offer.toLowerCase()}?`,
        ].slice(0, variantCount),
        variants: Array.from({ length: variantCount }).map((_, index) => ({
          label: String.fromCharCode(65 + index),
          subject: `Growth idea ${index + 1}`,
          message: `Hi {{fullName}}, we built a simple way to ${dto.objective.toLowerCase()} with ${dto.offer}. Open to a short walkthrough?`,
        })),
        sms: `Hi {{fullName}}, quick idea to ${dto.objective.toLowerCase()} using ${dto.offer}. Worth a 10-minute chat?`,
        whatsapp: `Hi {{fullName}}, sharing a quick growth idea around ${dto.offer}. If helpful, I can send the 3-step plan.`,
        voiceScript: `Hi {{fullName}}, this is BelSuite. We have a focused idea to help ${dto.audience} ${dto.objective.toLowerCase()}. If you are open, we can share the plan today.`,
        personalizationIdeas: ['Use first name', 'Reference company name', 'Reference recent trigger event'],
      };
    }
  }

  async optimizeSendTime(organizationId: string, dto: OptimizeSendTimeDto) {
    const days = dto.lookbackDays ?? 30;
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));

    const sentEvents = await this.prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        eventType: 'marketing.automation.message_sent',
        timestamp: { gte: since },
      },
      take: 5000,
      orderBy: { timestamp: 'desc' },
    });

    const emailSignals = await this.prisma.email.findMany({
      where: {
        organizationId,
        sentAt: { gte: since },
      },
      select: { sentAt: true, openedAt: true, clickedAt: true },
      take: 5000,
    });

    const hourScores = new Map<number, number>();
    for (let hour = 0; hour < 24; hour += 1) {
      hourScores.set(hour, 0);
    }

    for (const event of sentEvents) {
      const props = this.parseJson(event.properties);
      if (dto.channel && props.channel !== dto.channel) continue;
      const hour = event.timestamp.getUTCHours();
      hourScores.set(hour, (hourScores.get(hour) || 0) + 1);
    }

    if (!dto.channel || dto.channel === 'email') {
      for (const email of emailSignals) {
        const sentHour = email.sentAt?.getUTCHours();
        if (sentHour !== undefined) {
          hourScores.set(sentHour, (hourScores.get(sentHour) || 0) + 1);
        }
        const openHour = email.openedAt?.getUTCHours();
        if (openHour !== undefined) {
          hourScores.set(openHour, (hourScores.get(openHour) || 0) + 2);
        }
        const clickHour = email.clickedAt?.getUTCHours();
        if (clickHour !== undefined) {
          hourScores.set(clickHour, (hourScores.get(clickHour) || 0) + 3);
        }
      }
    }

    const ranked = Array.from(hourScores.entries())
      .map(([hour, score]) => ({ hour, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return {
      timezone: dto.timezone || 'UTC',
      channel: dto.channel || 'email',
      lookbackDays: days,
      recommendedHoursUtc: ranked.map((item) => item.hour),
      rationale:
        ranked.length > 0
          ? `Highest engagement was clustered around ${ranked.map((item) => `${item.hour}:00 UTC`).join(', ')}.`
          : 'No historical data. Defaulting to mid-morning UTC.',
    };
  }

  async autoOptimizeAbTest(organizationId: string, userId: string, dto: AutoOptimizeAbTestDto) {
    const scored = dto.variants.map((variant) => {
      const reasons: string[] = [];
      let score = 50;

      if (variant.subject && variant.subject.length >= 20 && variant.subject.length <= 60) {
        score += 10;
        reasons.push('Subject length is within a strong range');
      }

      if (variant.message.includes('{{fullName}}') || variant.message.includes('{{companyName}}')) {
        score += 12;
        reasons.push('Includes personalization tokens');
      }

      if (/today|now|quick|fast|priority|limited/i.test(variant.message)) {
        score += 8;
        reasons.push('Creates urgency');
      }

      if (/book|reply|schedule|start|see|watch/i.test(variant.message)) {
        score += 10;
        reasons.push('Contains a direct CTA');
      }

      const length = variant.message.length;
      if (length >= 80 && length <= 220) {
        score += 10;
        reasons.push('Message length is concise enough for outreach');
      }

      return {
        ...variant,
        score,
        reasons,
      };
    });

    let aiRecommendation: string | undefined;
    try {
      const response = await this.aiService.generateText(
        {
          prompt: `Choose the best outreach A/B variant and explain why in one sentence. Variants: ${JSON.stringify(scored)}`,
          model: AIModel.GPT_4_TURBO,
          temperature: 0.2,
          maxTokens: 120,
        },
        organizationId,
        userId,
        { type: 'best_quality' },
        true,
      );
      aiRecommendation = response.text.trim();
    } catch {
      aiRecommendation = undefined;
    }

    const winner = scored.sort((a, b) => b.score - a.score)[0];

    return {
      campaignId: dto.campaignId,
      metric: dto.metric || 'predicted_engagement',
      winner,
      variants: scored,
      recommendedTrafficSplit: {
        [winner.label]: 70,
        others: 30,
      },
      aiRecommendation,
    };
  }

  async getStats(organizationId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));

    const [campaigns, events] = await Promise.all([
      this.prisma.workflow.findMany({
        where: {
          organizationId,
          type: { in: [WorkflowType.SEQUENCE, WorkflowType.TRIGGER_BASED, WorkflowType.CONDITIONAL] },
        },
        include: { actions: true },
      }),
      this.prisma.analyticsEvent.findMany({
        where: {
          organizationId,
          eventType: {
            in: [
              'marketing.automation.run_started',
              'marketing.automation.event_triggered',
              'marketing.automation.message_sent',
            ],
          },
          timestamp: { gte: since },
        },
        orderBy: { timestamp: 'desc' },
        take: 10000,
      }),
    ]);

    const automationCampaigns = campaigns
      .map((workflow) => this.mapCampaign(workflow))
      .filter((campaign) => campaign.engine === 'marketing_automation');

    const messageEvents = events.filter((item) => item.eventType === 'marketing.automation.message_sent');
    const runs = events.filter((item) => item.eventType === 'marketing.automation.run_started').length;
    const triggered = events.filter((item) => item.eventType === 'marketing.automation.event_triggered').length;

    const byChannel = new Map<string, number>();
    const byStatus = new Map<string, number>();
    for (const event of messageEvents) {
      const props = this.parseJson(event.properties);
      const channel = this.readString(props.channel) || 'unknown';
      const status = this.readString(props.status) || 'unknown';
      byChannel.set(channel, (byChannel.get(channel) || 0) + 1);
      byStatus.set(status, (byStatus.get(status) || 0) + 1);
    }

    return {
      periodDays: days,
      totals: {
        campaigns: automationCampaigns.length,
        activeCampaigns: automationCampaigns.filter((campaign) => campaign.isActive).length,
        runs,
        triggeredRuns: triggered,
        messagesSent: messageEvents.length,
      },
      byChannel: Array.from(byChannel.entries()).map(([channel, count]) => ({ channel, count })),
      byStatus: Array.from(byStatus.entries()).map(([status, count]) => ({ status, count })),
      topCampaigns: automationCampaigns
        .sort((a, b) => b.executionCount - a.executionCount)
        .slice(0, 10),
    };
  }

  async ingestTwilioStatusCallback(
    callbackUrl: string,
    payload: TwilioStatusCallbackDto,
    signature?: string,
  ) {
    const isValidSignature = this.verifyTwilioSignature(callbackUrl, payload, signature);
    if (process.env['TWILIO_AUTH_TOKEN'] && !isValidSignature) {
      throw new UnauthorizedException('Invalid or missing Twilio signature');
    }

    const providerMessageId =
      payload.MessageSid || payload.SmsSid || payload.CallSid;

    if (!providerMessageId) {
      throw new BadRequestException('Missing provider message SID');
    }

    const matchedEvent = await this.prisma.analyticsEvent.findFirst({
      where: {
        eventType: 'marketing.automation.message_sent',
        properties: { contains: providerMessageId },
      },
      orderBy: { timestamp: 'desc' },
    });

    if (!matchedEvent) {
      return {
        accepted: true,
        matched: false,
        providerMessageId,
        signatureValid: isValidSignature,
      };
    }

    const messageProps = this.parseJson(matchedEvent.properties);
    const providerStatus = payload.MessageStatus || payload.SmsStatus || payload.CallStatus || 'unknown';

    await this.prisma.analyticsEvent.create({
      data: {
        organizationId: matchedEvent.organizationId,
        userId: matchedEvent.userId,
        eventType: 'marketing.automation.provider_status',
        properties: JSON.stringify({
          campaignId: messageProps.campaignId,
          campaignName: messageProps.campaignName,
          runId: messageProps.runId,
          stepId: messageProps.stepId,
          channel: messageProps.channel,
          provider: messageProps.provider || 'twilio',
          providerMessageId,
          providerStatus,
          recipient: payload.To,
          sender: payload.From,
          errorCode: payload.ErrorCode,
          errorMessage: payload.ErrorMessage,
          signatureValid: isValidSignature,
          callbackPayload: payload,
          receivedAt: new Date().toISOString(),
        }),
      },
    });

    await this.eventBus.publish({
      id: `marketing-provider-status-${Date.now()}`,
      type: 'marketing.automation.provider_status',
      tenantId: matchedEvent.organizationId,
      userId: matchedEvent.userId ?? undefined,
      data: {
        campaignId: messageProps.campaignId,
        campaignName: messageProps.campaignName,
        runId: messageProps.runId,
        stepId: messageProps.stepId,
        channel: messageProps.channel,
        status: providerStatus,
        providerMessageId,
      },
      timestamp: new Date(),
      correlationId: (messageProps.runId as string) || providerMessageId,
      version: 1,
      metadata: {
        environment: process.env['NODE_ENV'] ?? 'development',
        service: 'marketing-automation',
      },
    });

    return {
      accepted: true,
      matched: true,
      signatureValid: isValidSignature,
      providerMessageId,
      providerStatus,
      campaignId: messageProps.campaignId,
      runId: messageProps.runId,
    };
  }

  private async getCampaignWorkflow(organizationId: string, campaignId: string) {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id: campaignId, organizationId },
      include: { actions: { orderBy: { order: 'asc' } } },
    });

    if (!workflow) {
      throw new NotFoundException('Marketing automation campaign not found');
    }

    const trigger = this.parseJson(workflow.trigger);
    if (trigger.engine !== 'marketing_automation') {
      throw new NotFoundException('Marketing automation campaign not found');
    }

    return workflow;
  }

  private mapCampaign(workflow: any) {
    const triggerPayload = this.parseJson(workflow.trigger);
    return {
      id: workflow.id,
      engine: triggerPayload.engine,
      name: workflow.name,
      description: workflow.description,
      objective: this.readString(triggerPayload.objective) || 'engagement',
      isActive: workflow.isActive,
      executionCount: workflow.executionCount || 0,
      lastExecutedAt: workflow.lastExecutedAt,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
      trigger: triggerPayload.trigger || { mode: 'manual' },
      audience: triggerPayload.audience || {},
      personalizationFields: triggerPayload.personalizationFields || [],
      abTestSettings: triggerPayload.abTestSettings || {},
      optimizeSendTime: Boolean(triggerPayload.optimizeSendTime),
      builder: triggerPayload.builder || { nodes: [], edges: [] },
      channels: triggerPayload.channels || [],
      steps: this.parseSteps(workflow.actions),
    };
  }

  private parseSteps(actions: Array<{ config: string }>) {
    return actions.map((action) => this.parseJson(action.config) as CampaignStepDto);
  }

  private async queueCampaignContacts(
    organizationId: string,
    userId: string,
    campaign: any,
    runId: string,
    contacts: CampaignContactDto[],
    respectOptimalSendTime: boolean,
    metadata?: Record<string, unknown>,
  ) {
    let queued = 0;
    const recommendedHours = respectOptimalSendTime || campaign.optimizeSendTime
      ? (await this.optimizeSendTime(organizationId, { channel: 'email', lookbackDays: 30 })).recommendedHoursUtc
      : [];

    for (const contact of contacts) {
      let cumulativeDelayMs = 0;
      for (let index = 0; index < campaign.steps.length; index += 1) {
        const step = campaign.steps[index] as CampaignStepDto;
        if (!this.evaluateConditions(step.conditions || [], contact, metadata || {})) {
          continue;
        }

        const context = this.buildContext(contact, metadata || {});
        const variant = this.pickVariant(step.variants || [], context.identityKey);
        const renderedSubject = this.renderTemplate(variant?.subject || step.subject || '', context);
        const renderedMessage = this.renderTemplate(variant?.message || step.message || '', context);

        if (!this.hasRequiredRecipient(step.channel, contact)) {
          await this.prisma.analyticsEvent.create({
            data: {
              organizationId,
              userId,
              eventType: 'marketing.automation.message_skipped',
              properties: JSON.stringify({
                campaignId: campaign.id,
                runId,
                channel: step.channel,
                contact,
                reason: 'missing_recipient',
              }),
            },
          });
          continue;
        }

        cumulativeDelayMs += (step.delayHours || 0) * 60 * 60 * 1000;
        if (index === 0 && (respectOptimalSendTime || step.optimizeSendTime) && recommendedHours.length > 0) {
          cumulativeDelayMs += this.computeOptimalDelay(recommendedHours[0]);
        }

        const payload: MarketingAutomationJobPayload = {
          type: 'dispatch-step',
          organizationId,
          userId,
          campaignId: campaign.id,
          campaignName: campaign.name,
          runId,
          stepOrder: index + 1,
          stepId: `${campaign.id}:${index + 1}`,
          channel: step.channel,
          subject: renderedSubject || undefined,
          message: renderedMessage,
          contact: contact as Record<string, unknown>,
          metadata: {
            objective: campaign.objective,
            variantLabel: variant?.label,
            ...metadata,
          },
        };

        await this.queue.add(
          `dispatch:${campaign.id}:${runId}:${context.identityKey}:${index + 1}`,
          payload,
          {
            delay: cumulativeDelayMs,
            attempts: 3,
            backoff: { type: 'exponential', delay: 30000 },
            removeOnComplete: 100,
            removeOnFail: 100,
          },
        );
        queued += 1;
      }
    }

    return queued;
  }

  private determineWorkflowType(mode: string, steps: CampaignStepDto[]) {
    if (mode === 'event') return WorkflowType.TRIGGER_BASED;
    if (steps.some((step) => (step.delayHours || 0) > 0)) return WorkflowType.SEQUENCE;
    return WorkflowType.CONDITIONAL;
  }

  private extractChannels(steps: CampaignStepDto[]) {
    return Array.from(new Set(steps.map((step) => step.channel))).filter((channel) =>
      AUTOMATION_CHANNELS.includes(channel),
    );
  }

  private parseJson(raw?: string | null): Record<string, any> {
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  private verifyTwilioSignature(
    callbackUrl: string,
    payload: TwilioStatusCallbackDto,
    signature?: string,
  ) {
    const authToken = process.env['TWILIO_AUTH_TOKEN'];
    if (!authToken || !signature) {
      return false;
    }

    try {
      const keys = Object.keys(payload).sort();
      let data = callbackUrl;
      for (const key of keys) {
        const value = (payload as Record<string, unknown>)[key];
        if (value !== undefined && value !== null) {
          data += key + String(value);
        }
      }

      const computed = createHmac('sha1', authToken).update(data).digest('base64');

      return computed === signature;
    } catch {
      return false;
    }
  }

  private safeJson(raw: string): Record<string, unknown> {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      try {
        return JSON.parse(cleaned) as Record<string, unknown>;
      } catch {
        return { raw };
      }
    }
  }

  private buildContext(contact: CampaignContactDto, metadata: Record<string, unknown>) {
    const attributes = (contact.attributes || {}) as Record<string, unknown>;
    const merged = {
      ...attributes,
      ...metadata,
      ...contact,
    } as Record<string, unknown>;

    return {
      values: merged,
      identityKey:
        this.readString(contact.id) ||
        this.readString(contact.email) ||
        this.readString(contact.phone) ||
        randomUUID(),
    };
  }

  private renderTemplate(template: string, context: { values: Record<string, unknown> }) {
    return template.replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (_match, key) => {
      const value = context.values[key];
      return value === undefined || value === null ? '' : String(value);
    }).trim();
  }

  private pickVariant(variants: Array<AbTestVariantDto>, identityKey: string) {
    if (!variants || variants.length === 0) return undefined;
    const bucket = this.hash(identityKey) % variants.length;
    return variants[bucket];
  }

  private hash(value: string) {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return hash;
  }

  private evaluateConditions(
    conditions: Array<{ field: string; operator: string; value?: unknown }>,
    contact: CampaignContactDto,
    metadata: Record<string, unknown>,
  ) {
    const lookup = { ...(contact.attributes || {}), ...metadata, ...contact } as Record<string, unknown>;
    return conditions.every((condition) => {
      const current = lookup[condition.field];
      switch (condition.operator) {
        case 'exists':
          return current !== undefined && current !== null && current !== '';
        case 'equals':
          return String(current ?? '') === String(condition.value ?? '');
        case 'contains':
          return String(current ?? '').toLowerCase().includes(String(condition.value ?? '').toLowerCase());
        case 'gt':
          return Number(current ?? 0) > Number(condition.value ?? 0);
        case 'lt':
          return Number(current ?? 0) < Number(condition.value ?? 0);
        default:
          return true;
      }
    });
  }

  private hasRequiredRecipient(channel: string, contact: CampaignContactDto) {
    if (channel === 'email') return Boolean(contact.email);
    if (channel === 'sms' || channel === 'whatsapp' || channel === 'voice' || channel === 'ai_voice_agent') {
      return Boolean(contact.phone);
    }
    return true;
  }

  private computeOptimalDelay(targetHourUtc: number) {
    const now = new Date();
    const target = new Date(now);
    target.setUTCMinutes(0, 0, 0);
    target.setUTCHours(targetHourUtc);
    if (target.getTime() <= now.getTime()) {
      target.setUTCDate(target.getUTCDate() + 1);
    }
    return target.getTime() - now.getTime();
  }

  private readString(value: unknown) {
    return typeof value === 'string' ? value : undefined;
  }
}
