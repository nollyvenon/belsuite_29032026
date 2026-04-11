import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EventBus } from '../common/events/event.bus';
import { AIService } from '../ai/ai.service';
import { AIModel } from '../ai/types/ai.types';
import { PrismaService } from '../database/prisma.service';
import {
  AICallingListQueryDto,
  BookAppointmentDto,
  ConversationTurnDto,
  CreateVoiceAgentDto,
  StartAICallDto,
  TwilioVoiceWebhookDto,
} from './dto/ai-calling.dto';
import { AI_CALLING_QUEUE } from './processors/ai-calling.processor';
import { CallingProviderService } from './services/calling-provider.service';

@Injectable()
export class AICallingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly providerService: CallingProviderService,
    @InjectQueue(AI_CALLING_QUEUE) private readonly queue: Queue,
    private readonly eventBus: EventBus,
  ) {}

  async createVoiceAgent(organizationId: string, userId: string, dto: CreateVoiceAgentDto) {
    const agentProps = {
      objective: dto.objective || 'book_appointments',
      industry: dto.industry,
      style: dto.style || 'consultative',
      objectionPlaybook: dto.objectionPlaybook || [],
      qualificationQuestions: dto.qualificationQuestions || [],
    };
    const event = await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'ai.voice_agent.created',
        properties: JSON.stringify({
          name: dto.name,
          ...agentProps,
          memoryConfig: dto.memoryConfig || { retainTurns: 24 },
          createdAt: new Date().toISOString(),
        }),
      },
    });

    await this.eventBus.publish({
      id: `ai-call-created-${event.id}`,
      type: 'ai.call.created',
      tenantId: organizationId,
      userId,
      data: {
        callId: event.id,
        voiceAgentId: dto.voiceAgentId,
      },
      timestamp: new Date(),
      correlationId: event.id,
      version: 1,
      metadata: {
        environment: process.env['NODE_ENV'] ?? 'development',
        service: 'ai-calling',
      },
    });

    return this.mapVoiceAgent(event);
  }

  async listVoiceAgents(organizationId: string) {
    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        eventType: 'ai.voice_agent.created',
      },
      orderBy: { timestamp: 'desc' },
      take: 200,
    });

    return events.map((event) => this.mapVoiceAgent(event));
  }

  async startCall(organizationId: string, userId: string, dto: StartAICallDto) {
    const agent = await this.prisma.analyticsEvent.findFirst({
      where: {
        id: dto.voiceAgentId,
        organizationId,
        eventType: 'ai.voice_agent.created',
      },
    });

    if (!agent) {
      throw new NotFoundException('Voice agent not found');
    }

    const agentProps = this.parse(agent.properties);
    const openingScript = await this.generateOpeningScript(organizationId, userId, {
      lead: { ...dto.lead },
      objective: dto.objective || agentProps.objective || 'book a growth strategy call',
      style: agentProps.style || 'consultative',
      industry: agentProps.industry,
    });

    const call = await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'ai.call.created',
        properties: JSON.stringify({
          voiceAgentId: dto.voiceAgentId,
          lead: dto.lead,
          campaignId: dto.campaignId,
          objective: dto.objective || agentProps.objective || 'book_appointment',
          status: 'queued',
          openingScript,
          conversationMemory: [],
          createdAt: new Date().toISOString(),
        }),
      },
    });

    await this.eventBus.publish({
      id: `ai-call-dispatched-${call.id}`,
      type: 'ai.call.dispatched',
      tenantId: organizationId,
      userId,
      data: {
        callId: call.id,
        status: 'queued',
        objective: agentProps.objective,
      },
      timestamp: new Date(),
      correlationId: call.id,
      version: 1,
      metadata: {
        environment: process.env['NODE_ENV'] ?? 'development',
        service: 'ai-calling',
      },
    });

    await this.persistCrmCallLink(organizationId, userId, call.id, dto.lead, {
      objective: dto.objective || agentProps.objective || 'book_appointment',
      voiceAgentId: dto.voiceAgentId,
      status: 'queued',
    });

    await this.writeCrmActivity(organizationId, userId, dto.lead.leadId, {
      title: `AI call queued for ${dto.lead.fullName || dto.lead.phone}`,
      description: `Objective: ${dto.objective || agentProps.objective || 'book_appointment'}`,
      sourceEventType: 'ai.call.created',
      sourceEventId: call.id,
    });

    await this.queue.add(
      `start-call:${call.id}`,
      {
        type: 'start-call',
        organizationId,
        userId,
        callId: call.id,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: 200,
        removeOnFail: 200,
      },
    );

    return {
      callId: call.id,
      status: 'queued',
      openingScript,
    };
  }

  async listCalls(organizationId: string, query: AICallingListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        eventType: 'ai.call.created',
      },
      orderBy: { timestamp: 'desc' },
      take: 300,
    });

    const mapped = events.map((event) => this.mapCall(event));
    const filtered = mapped.filter((call) => {
      const statusOk = query.status ? call.status === query.status : true;
      const q = query.q?.toLowerCase();
      const qOk = q ? JSON.stringify(call).toLowerCase().includes(q) : true;
      return statusOk && qOk;
    });

    return {
      items: filtered.slice(skip, skip + limit),
      page,
      limit,
      total: filtered.length,
    };
  }

  async getCall(organizationId: string, callId: string) {
    const call = await this.prisma.analyticsEvent.findFirst({
      where: { id: callId, organizationId, eventType: 'ai.call.created' },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    const memory = await this.getConversationMemory(organizationId, callId);
    const details = this.mapCall(call);
    return {
      ...details,
      memory,
    };
  }

  async handleConversationTurn(
    organizationId: string,
    userId: string,
    callId: string,
    dto: ConversationTurnDto,
  ) {
    const call = await this.prisma.analyticsEvent.findFirst({
      where: { id: callId, organizationId, eventType: 'ai.call.created' },
    });
    if (!call) throw new NotFoundException('Call not found');

    const props = this.parse(call.properties);
    const customerText = dto.text || dto.transcript;
    if (!customerText) {
      throw new BadRequestException('Missing transcript or text input');
    }

    const agentProps = this.parse(call.properties);
    await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'ai.call.turn.customer',
        properties: JSON.stringify({
          callId,
          text: customerText,
          intentHint: dto.intentHint,
          metadata: dto.metadata,
          createdAt: new Date().toISOString(),
        }),
      },
    });

    await this.persistCrmFollowUp(organizationId, userId, callId, customerText, aiReply, qualification);
    await this.writeCrmActivity(organizationId, userId, props.lead?.leadId, {
      title: `AI call follow-up for ${props.lead?.fullName || props.lead?.phone || callId}`,
      description: aiReply,
      sourceEventType: 'ai.call.turn.agent',
      sourceEventId: callId,
    });

    const memory = await this.getConversationMemory(organizationId, callId, 12);
    const aiReply = await this.generateReply(organizationId, userId, {
      objective: props.objective || 'book_appointment',
      lead: props.lead,
      objectionPlaybook: props.objectionPlaybook || [],
      qualificationQuestions: props.qualificationQuestions || [],
      memory,
      customerText,
    });

    const qualification = await this.qualifyLead(organizationId, userId, {
      lead: props.lead,
      customerText,
      memory,
    });

    await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'ai.call.turn.agent',
        properties: JSON.stringify({
          callId,
          text: aiReply,
          qualification,
          createdAt: new Date().toISOString(),
        }),
      },
    });

    return {
      callId,
      agentReply: aiReply,
      qualification,
    };
  }

  async bookAppointment(organizationId: string, userId: string, dto: BookAppointmentDto) {
    const call = await this.prisma.analyticsEvent.findFirst({
      where: {
        id: dto.callId,
        organizationId,
        eventType: 'ai.call.created',
      },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'ai.call.appointment.booked',
        properties: JSON.stringify({
          callId: dto.callId,
          appointmentAt: dto.appointmentAt,
          timezone: dto.timezone || 'UTC',
          notes: dto.notes,
          bookedAt: new Date().toISOString(),
        }),
      },
    });

    await this.eventBus.publish({
      id: `ai-call-booked-${dto.callId}`,
      type: 'ai.call.appointment.booked',
      tenantId: organizationId,
      userId,
      data: {
        callId: dto.callId,
        appointmentAt: dto.appointmentAt,
        timezone: dto.timezone || 'UTC',
        notes: dto.notes,
      },
      timestamp: new Date(),
      correlationId: dto.callId,
      version: 1,
      metadata: {
        environment: process.env['NODE_ENV'] ?? 'development',
        service: 'ai-calling',
      },
    });

    await this.persistAppointmentOutcome(organizationId, userId, dto.callId, dto.appointmentAt, dto.notes);
    await this.writeCrmActivity(organizationId, userId, this.findLeadIdForCall(dto.callId), {
      title: 'Appointment booked from AI call',
      description: `Booked for ${dto.appointmentAt}`,
      sourceEventType: 'ai.call.appointment.booked',
      sourceEventId: dto.callId,
    });

    return {
      callId: dto.callId,
      status: 'booked',
      appointmentAt: dto.appointmentAt,
      timezone: dto.timezone || 'UTC',
    };
  }

  async ingestTwilioVoiceWebhook(
    callbackUrl: string,
    payload: TwilioVoiceWebhookDto,
    signature?: string,
  ) {
    const signatureValid = this.providerService.verifyTwilioSignature(
      callbackUrl,
      payload as Record<string, unknown>,
      signature,
    );
    if (process.env['TWILIO_AUTH_TOKEN'] && !signatureValid) {
      throw new UnauthorizedException('Invalid or missing Twilio signature');
    }

    const providerCallSid = payload.CallSid;
    if (!providerCallSid) {
      throw new BadRequestException('Missing CallSid');
    }

    const dispatched = await this.prisma.analyticsEvent.findFirst({
      where: {
        eventType: 'ai.call.dispatched',
        properties: { contains: providerCallSid },
      },
      orderBy: { timestamp: 'desc' },
    });

    if (!dispatched) {
      return {
        accepted: true,
        matched: false,
        providerCallSid,
        signatureValid,
      };
    }

    const dispatchedProps = this.parse(dispatched.properties);
    const callId = dispatchedProps.callId as string;

    await this.prisma.analyticsEvent.create({
      data: {
        organizationId: dispatched.organizationId,
        userId: dispatched.userId,
        eventType: 'ai.call.provider.status',
        properties: JSON.stringify({
          callId,
          providerCallSid,
          callStatus: payload.CallStatus,
          from: payload.From,
          to: payload.To,
          speechResult: payload.SpeechResult,
          confidence: payload.Confidence,
          signatureValid,
          callbackPayload: payload,
          receivedAt: new Date().toISOString(),
        }),
      },
    });

    if (payload.SpeechResult) {
      const effectiveUserId =
        dispatched.userId ?? (process.env.NODE_ENV === 'production' ? null : 'system');
      if (!effectiveUserId) {
        throw new Error('Missing userId in production voice callback');
      }
      await this.handleConversationTurn(dispatched.organizationId, effectiveUserId, callId, {
        transcript: payload.SpeechResult,
        metadata: {
          confidence: payload.Confidence,
          source: 'twilio_voice_webhook',
        },
      });
    }

    if (payload.CallStatus === 'completed' || payload.CallStatus === 'no-answer' || payload.CallStatus === 'busy') {
      await this.persistCallCompletion(
        dispatched.organizationId,
        dispatched.userId,
        callId,
        payload.CallStatus,
        payload.RecordingUrl,
      );
      await this.writeCrmActivity(dispatched.organizationId, dispatched.userId, this.findLeadIdForCall(callId), {
        title: `AI call ${payload.CallStatus}`,
        description: payload.RecordingUrl ? `Recording: ${payload.RecordingUrl}` : `Status: ${payload.CallStatus}`,
        sourceEventType: 'ai.call.provider.status',
        sourceEventId: callId,
      });
    }

    return {
      accepted: true,
      matched: true,
      callId,
      providerCallSid,
      signatureValid,
      callStatus: payload.CallStatus,
    };
  }

  async ingestTwilioRecordingWebhook(
    callbackUrl: string,
    payload: TwilioVoiceWebhookDto,
    signature?: string,
  ) {
    const signatureValid = this.providerService.verifyTwilioSignature(
      callbackUrl,
      payload as Record<string, unknown>,
      signature,
    );
    if (process.env['TWILIO_AUTH_TOKEN'] && !signatureValid) {
      throw new UnauthorizedException('Invalid or missing Twilio signature');
    }

    if (!payload.CallSid) {
      throw new BadRequestException('Missing CallSid in recording callback');
    }

    const dispatched = await this.prisma.analyticsEvent.findFirst({
      where: {
        eventType: 'ai.call.dispatched',
        properties: { contains: payload.CallSid },
      },
      orderBy: { timestamp: 'desc' },
    });

    if (!dispatched) {
      return {
        accepted: true,
        matched: false,
        providerCallSid: payload.CallSid,
        signatureValid,
      };
    }

    const props = this.parse(dispatched.properties);
    const callId = props.callId as string;

    await this.prisma.analyticsEvent.create({
      data: {
        organizationId: dispatched.organizationId,
        userId: dispatched.userId,
        eventType: 'ai.call.recording.available',
        properties: JSON.stringify({
          callId,
          providerCallSid: payload.CallSid,
          recordingSid: payload.RecordingSid,
          recordingUrl: payload.RecordingUrl,
          recordingStatus: payload.RecordingStatus,
          recordingDuration: payload.RecordingDuration,
          signatureValid,
          receivedAt: new Date().toISOString(),
        }),
      },
    });

    if (payload.RecordingUrl) {
      await this.queue.add(
        `transcribe:${callId}:${payload.RecordingSid || Date.now()}`,
        {
          type: 'transcribe-recording',
          organizationId: dispatched.organizationId,
          userId: dispatched.userId || undefined,
          callId,
          providerCallSid: payload.CallSid,
          recordingSid: payload.RecordingSid,
          recordingUrl: payload.RecordingUrl,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 10000 },
          removeOnComplete: 200,
          removeOnFail: 200,
        },
      );
    }

    await this.persistRecordingOutcome(
      dispatched.organizationId,
      dispatched.userId,
      callId,
      payload.RecordingUrl,
      payload.RecordingDuration,
    );

    return {
      accepted: true,
      matched: true,
      callId,
      providerCallSid: payload.CallSid,
      recordingSid: payload.RecordingSid,
      signatureValid,
    };
  }

  async getStats(organizationId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        eventType: {
          in: [
            'ai.call.created',
            'ai.call.dispatched',
            'ai.call.provider.status',
            'ai.call.turn.customer',
            'ai.call.turn.agent',
            'ai.call.appointment.booked',
            'ai.call.recording.transcribed',
          ],
        },
        timestamp: { gte: since },
      },
      take: 10000,
      orderBy: { timestamp: 'desc' },
    });

    const calls = events.filter((e) => e.eventType === 'ai.call.created').length;
    const booked = events.filter((e) => e.eventType === 'ai.call.appointment.booked').length;
    const transcribed = events.filter((e) => e.eventType === 'ai.call.recording.transcribed').length;
    const providerStatuses = events
      .filter((e) => e.eventType === 'ai.call.provider.status')
      .map((e) => this.parse(e.properties).callStatus || 'unknown');

    const statusMap = new Map<string, number>();
    for (const status of providerStatuses) {
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    }

    return {
      periodDays: days,
      totals: {
        calls,
        booked,
        bookingRate: calls === 0 ? 0 : Number(((booked / calls) * 100).toFixed(2)),
        transcribed,
      },
      byProviderStatus: Array.from(statusMap.entries()).map(([status, count]) => ({ status, count })),
    };
  }

  private async generateOpeningScript(
    organizationId: string,
    userId: string,
    context: {
      lead: Record<string, unknown>;
      objective: string;
      style: string;
      industry?: string;
    },
  ) {
    const prompt = `You are an expert AI SDR.
Create an outbound cold-call opener under 90 words.
Objective: ${context.objective}
Style: ${context.style}
Lead: ${JSON.stringify(context.lead)}
Industry: ${context.industry || 'general'}
Must include: rapport line, value hook, and clear question.
Return plain text only.`;

    try {
      const ai = await this.aiService.generateText(
        {
          prompt,
          model: AIModel.GPT_4_TURBO,
          temperature: 0.35,
          maxTokens: 200,
        },
        organizationId,
        userId,
        { type: 'best_quality' },
        true,
      );
      return ai.text.trim();
    } catch {
      const name = (context.lead.fullName as string) || 'there';
      return `Hi ${name}, this is BelSuite. We help teams automate lead conversion and reduce manual outreach work. Would it be useful if I shared a 60-second plan tailored to your pipeline goals?`;
    }
  }

  private async generateReply(
    organizationId: string,
    userId: string,
    context: {
      objective: string;
      lead: Record<string, unknown>;
      objectionPlaybook: string[];
      qualificationQuestions: string[];
      memory: Array<{ role: string; text: string }>;
      customerText: string;
    },
  ) {
    const prompt = `You are a high-performing AI sales agent.
Objective: ${context.objective}
Lead profile: ${JSON.stringify(context.lead)}
Conversation memory: ${JSON.stringify(context.memory)}
Customer latest response: ${context.customerText}
Objection playbook: ${JSON.stringify(context.objectionPlaybook)}
Qualification prompts: ${JSON.stringify(context.qualificationQuestions)}
Requirements:
- handle objections naturally
- ask one qualification question if needed
- push toward appointment booking when ready
- under 80 words
Return plain text only.`;

    try {
      const ai = await this.aiService.generateText(
        {
          prompt,
          model: AIModel.GPT_4_TURBO,
          temperature: 0.4,
          maxTokens: 220,
        },
        organizationId,
        userId,
        { type: 'best_quality' },
        true,
      );

      return ai.text.trim();
    } catch {
      return 'That makes sense. To ensure this is relevant, could you share your top growth goal this quarter and whether you have a target timeline?';
    }
  }

  private async qualifyLead(
    organizationId: string,
    userId: string,
    context: {
      lead: Record<string, unknown>;
      customerText: string;
      memory: Array<{ role: string; text: string }>;
    },
  ) {
    const prompt = `You are a B2B qualification assistant.
Lead: ${JSON.stringify(context.lead)}
Conversation memory: ${JSON.stringify(context.memory)}
Latest customer text: ${context.customerText}
Return strict JSON with keys: score, intent, budgetSignal, timelineSignal, authoritySignal, summary.
Score must be 0-100.
Only return JSON.`;

    try {
      const ai = await this.aiService.generateText(
        {
          prompt,
          model: AIModel.GPT_4_TURBO,
          temperature: 0.2,
          maxTokens: 260,
        },
        organizationId,
        userId,
        { type: 'best_quality' },
        true,
      );

      return this.safeJson(ai.text);
    } catch {
      return {
        score: 55,
        intent: 'medium',
        budgetSignal: 'unknown',
        timelineSignal: 'unknown',
        authoritySignal: 'unknown',
        summary: 'Insufficient signal, continue qualification.',
      };
    }
  }

  private async getConversationMemory(organizationId: string, callId: string, take = 24) {
    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        eventType: { in: ['ai.call.turn.customer', 'ai.call.turn.agent'] },
        properties: { contains: callId },
      },
      orderBy: { timestamp: 'asc' },
      take,
    });

    return events.map((event) => {
      const props = this.parse(event.properties);
      return {
        role: event.eventType === 'ai.call.turn.customer' ? 'customer' : 'agent',
        text: (props.text as string) || '',
        createdAt: event.timestamp,
      };
    });
  }

  private mapVoiceAgent(event: { id: string; properties: string | null; timestamp: Date }) {
    const props = this.parse(event.properties);
    return {
      id: event.id,
      name: props.name,
      objective: props.objective,
      industry: props.industry,
      style: props.style,
      objectionPlaybook: props.objectionPlaybook || [],
      qualificationQuestions: props.qualificationQuestions || [],
      createdAt: event.timestamp,
    };
  }

  private mapCall(event: { id: string; properties: string | null; timestamp: Date }) {
    const props = this.parse(event.properties);
    return {
      id: event.id,
      voiceAgentId: props.voiceAgentId,
      lead: props.lead,
      campaignId: props.campaignId,
      objective: props.objective,
      status: props.status || 'queued',
      createdAt: event.timestamp,
    };
  }

  private parse(raw?: string | null): Record<string, any> {
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
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

  private async persistCrmCallLink(
    organizationId: string,
    userId: string,
    callId: string,
    lead: Record<string, unknown>,
    details: Record<string, unknown>,
  ) {
    await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'crm.call.linked',
        properties: JSON.stringify({ callId, lead, details, linkedAt: new Date().toISOString() }),
      },
    });
  }

  private async persistCrmFollowUp(
    organizationId: string,
    userId: string,
    callId: string,
    customerText: string,
    aiReply: string,
    qualification: Record<string, unknown>,
  ) {
    await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'crm.call.follow_up_created',
        properties: JSON.stringify({
          callId,
          customerText,
          aiReply,
          qualification,
          createdAt: new Date().toISOString(),
        }),
      },
    });
  }

  private async persistAppointmentOutcome(
    organizationId: string,
    userId: string,
    callId: string,
    appointmentAt: string,
    notes?: string,
  ) {
    await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'crm.call.appointment_booked',
        properties: JSON.stringify({ callId, appointmentAt, notes, bookedAt: new Date().toISOString() }),
      },
    });
  }

  private async persistCallCompletion(
    organizationId: string,
    userId: string | undefined,
    callId: string,
    status: string,
    recordingUrl?: string | null,
  ) {
    await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'crm.call.completed',
        properties: JSON.stringify({ callId, status, recordingUrl, completedAt: new Date().toISOString() }),
      },
    });
  }

  private async persistRecordingOutcome(
    organizationId: string,
    userId: string | undefined,
    callId: string,
    recordingUrl?: string | null,
    duration?: string | null,
  ) {
    await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'crm.call.recording_received',
        properties: JSON.stringify({ callId, recordingUrl, duration, receivedAt: new Date().toISOString() }),
      },
    });
  }

  private async writeCrmActivity(
    organizationId: string,
    userId: string | undefined,
    leadId: string | undefined,
    details: {
      title: string;
      description?: string;
      sourceEventType: string;
      sourceEventId: string;
    },
  ) {
    if (!leadId) return;
    await this.prisma.activity.create({
      data: {
        organizationId,
        leadId,
        title: details.title,
        description: details.description ?? null,
        sourceEventType: details.sourceEventType,
        sourceEventId: details.sourceEventId,
        aiGenerated: true,
      } as any,
    });
  }

  private findLeadIdForCall(callId: string) {
    return undefined;
  }
}
