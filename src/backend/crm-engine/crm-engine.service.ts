import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AIService } from '../ai/ai.service';
import { AIModel } from '../ai/types/ai.types';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/services/email.service';
import {
  CRM_STAGES,
  DispatchOutreachMessageDto,
  GenerateSequencePlanDto,
  ImportLeadToCrmDto,
  MarkConversionDto,
  OutreachStepDto,
  PipelineQueryDto,
  StageTransitionDto,
  StartOutreachSequenceDto,
} from './dto/crm-engine.dto';

type CrmStage = (typeof CRM_STAGES)[number];

export interface CrmPipelineLead {
  crmLeadId: string;
  sourceLeadEventId?: string;
  stage: CrmStage;
  score: number;
  fullName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  source?: string;
  notes?: string;
  converted: boolean;
  conversionStatus?: 'won' | 'lost';
  conversionValue?: number;
  lastActivityAt: string;
  touches: number;
}

@Injectable()
export class CrmEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly emailService: EmailService,
  ) {}

  async importLeadToCrm(organizationId: string, userId: string, dto: ImportLeadToCrmDto) {
    const sourceLead = dto.leadEventId
      ? await this.prisma.analyticsEvent.findFirst({
          where: {
            id: dto.leadEventId,
            organizationId,
            eventType: { in: ['lead.scraped', 'lead.enriched'] },
          },
        })
      : null;

    if (dto.leadEventId && !sourceLead) {
      throw new NotFoundException('Lead source event not found');
    }

    const sourceProps = this.parseProperties(sourceLead?.properties);
    const sourceProspect = (sourceProps?.prospect || {}) as Record<string, unknown>;
    const initialStage: CrmStage = dto.initialStage || 'qualified';

    const payload = {
      crmLeadId: 'pending',
      sourceLeadEventId: sourceLead?.id,
      stage: initialStage,
      score: this.scoreLead({
        ...sourceProspect,
        email: dto.email || sourceProspect.email,
        phone: dto.phone || sourceProspect.phone,
        companyName: dto.companyName || sourceProspect.companyName,
      }),
      lead: {
        fullName: dto.fullName || this.readString(sourceProspect.fullName),
        email: dto.email || this.readString(sourceProspect.email),
        phone: dto.phone || this.readString(sourceProspect.phone),
        companyName: dto.companyName || this.readString(sourceProspect.companyName),
        industry: dto.industry || this.readString(sourceProspect.industry),
        source: dto.source || this.readString(sourceProps.source) || 'crm_import',
      },
      notes: dto.notes,
      importedAt: new Date().toISOString(),
    };

    const created = await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'crm.lead.imported',
        properties: JSON.stringify(payload),
      },
    });

    const finalPayload = {
      ...payload,
      crmLeadId: created.id,
    };

    await this.prisma.analyticsEvent.update({
      where: { id: created.id },
      data: { properties: JSON.stringify(finalPayload) },
    });

    return {
      crmLeadId: created.id,
      stage: initialStage,
      lead: finalPayload.lead,
      score: finalPayload.score,
    };
  }

  async listPipeline(organizationId: string, query: PipelineQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const pipeline = await this.rebuildPipeline(organizationId);

    const filtered = pipeline.filter((lead) => {
      const stageOk = query.stage ? lead.stage === query.stage : true;
      const q = query.q?.toLowerCase();
      const queryOk = q ? JSON.stringify(lead).toLowerCase().includes(q) : true;
      return stageOk && queryOk;
    });

    const items = filtered
      .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())
      .slice(skip, skip + limit);

    return {
      items,
      page,
      limit,
      total: filtered.length,
      stageDistribution: this.countByStage(filtered),
    };
  }

  async transitionStage(organizationId: string, userId: string, dto: StageTransitionDto) {
    const exists = await this.prisma.analyticsEvent.findFirst({
      where: { id: dto.crmLeadId, organizationId, eventType: 'crm.lead.imported' },
    });
    if (!exists) throw new NotFoundException('CRM lead not found');

    const event = await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'crm.pipeline.stage_changed',
        properties: JSON.stringify({
          crmLeadId: dto.crmLeadId,
          toStage: dto.toStage,
          reason: dto.reason,
          changedAt: new Date().toISOString(),
        }),
      },
    });

    return {
      id: event.id,
      crmLeadId: dto.crmLeadId,
      stage: dto.toStage,
      changedAt: event.timestamp,
    };
  }

  async generateSequencePlan(organizationId: string, userId: string, dto: GenerateSequencePlanDto) {
    const lead = await this.getLeadFromCrm(organizationId, dto.crmLeadId);
    const maxTouches = dto.maxTouches || 4;

    const prompt = `You are a B2B CRM conversion strategist. Produce strict JSON with keys: objective, touches, channels, steps, riskFlags.
Lead profile: ${JSON.stringify(lead)}
Objective: ${dto.objective || 'Convert lead to booked strategy call'}
Constraints: ${maxTouches} touches max, short persuasive copy.
Only return valid JSON.`;

    try {
      const ai = await this.aiService.generateText(
        {
          prompt,
          model: AIModel.GPT_4_TURBO,
          maxTokens: 700,
          temperature: 0.35,
        },
        organizationId,
        userId,
        { type: 'best_quality' },
        true,
      );

      return {
        crmLeadId: dto.crmLeadId,
        plan: this.safeJson(ai.text),
      };
    } catch {
      return {
        crmLeadId: dto.crmLeadId,
        plan: {
          objective: dto.objective || 'Convert lead to booked strategy call',
          touches: 3,
          channels: ['email', 'linkedin'],
          steps: [
            { day: 1, channel: 'email', angle: 'ROI opportunity snapshot' },
            { day: 3, channel: 'linkedin', angle: 'social proof + quick audit offer' },
            { day: 6, channel: 'email', angle: 'clear CTA with urgency' },
          ],
          riskFlags: ['Missing personalization data'],
        },
      };
    }
  }

  async startOutreachSequence(
    organizationId: string,
    userId: string,
    dto: StartOutreachSequenceDto,
  ) {
    const lead = await this.getLeadFromCrm(organizationId, dto.crmLeadId);

    const steps = dto.steps && dto.steps.length > 0 ? dto.steps : this.defaultSequence(lead.fullName);

    const sequence = await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'crm.outreach.sequence_started',
        properties: JSON.stringify({
          crmLeadId: dto.crmLeadId,
          objective: dto.objective || 'nurture_to_conversion',
          steps,
          startedAt: new Date().toISOString(),
        }),
      },
    });

    if (!dto.autoDispatch) {
      return {
        sequenceId: sequence.id,
        crmLeadId: dto.crmLeadId,
        dispatched: [],
      };
    }

    const dispatched = [] as Array<Record<string, unknown>>;
    for (let i = 0; i < steps.length; i += 1) {
      const step = steps[i];
      const result = await this.dispatchOutreachMessage(organizationId, userId, {
        crmLeadId: dto.crmLeadId,
        channel: step.channel,
        subject: step.subject,
        message: step.message || `Quick follow-up for ${lead.fullName || 'your growth goals'}.`,
      });
      dispatched.push({ step: i + 1, ...result });
    }

    return {
      sequenceId: sequence.id,
      crmLeadId: dto.crmLeadId,
      dispatched,
    };
  }

  async dispatchOutreachMessage(
    organizationId: string,
    userId: string,
    dto: DispatchOutreachMessageDto,
  ) {
    const lead = await this.getLeadFromCrm(organizationId, dto.crmLeadId);

    const recipient = dto.to || (dto.channel === 'email' ? lead.email : lead.phone);
    if (!recipient) {
      throw new BadRequestException('Recipient is required for the selected channel');
    }

    const subject = dto.subject || `Growth idea for ${lead.companyName || 'your team'}`;
    let providerMessageId: string | undefined;
    let status = 'queued';

    if (dto.channel === 'email') {
      const response = await this.emailService.send(
        {
          to: recipient,
          subject,
          html: `<p>${dto.message}</p>`,
          text: dto.message,
          tags: ['crm_outreach'],
          metadata: {
            crmLeadId: dto.crmLeadId,
            channel: dto.channel,
          },
        },
        organizationId,
      );

      status = response.success ? 'sent' : 'failed';
      providerMessageId = response.messageId;
    }

    if (dto.channel !== 'email') {
      status = 'simulated';
    }

    const event = await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'crm.outreach.message_sent',
        properties: JSON.stringify({
          crmLeadId: dto.crmLeadId,
          channel: dto.channel,
          recipient,
          subject,
          message: dto.message,
          status,
          providerMessageId,
          sentAt: new Date().toISOString(),
        }),
      },
    });

    return {
      outreachEventId: event.id,
      crmLeadId: dto.crmLeadId,
      channel: dto.channel,
      status,
      recipient,
      providerMessageId,
    };
  }

  async markConversion(organizationId: string, userId: string, dto: MarkConversionDto) {
    await this.getLeadFromCrm(organizationId, dto.crmLeadId);

    const existing = await this.prisma.analyticsEvent.findFirst({
      where: {
        organizationId,
        eventType: 'crm.conversion.marked',
        properties: { contains: dto.crmLeadId },
      },
      orderBy: { timestamp: 'desc' },
    });

    if (existing) {
      throw new BadRequestException('Lead conversion has already been marked');
    }

    const event = await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'crm.conversion.marked',
        properties: JSON.stringify({
          crmLeadId: dto.crmLeadId,
          status: dto.status,
          value: dto.value || 0,
          currency: dto.currency || 'USD',
          note: dto.note,
          markedAt: new Date().toISOString(),
        }),
      },
    });

    return {
      conversionEventId: event.id,
      crmLeadId: dto.crmLeadId,
      status: dto.status,
      value: dto.value || 0,
      currency: dto.currency || 'USD',
    };
  }

  async getCrmStats(organizationId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));

    const pipeline = await this.rebuildPipeline(organizationId, since);
    const converted = pipeline.filter((lead) => lead.converted).length;
    const won = pipeline.filter((lead) => lead.conversionStatus === 'won').length;
    const lost = pipeline.filter((lead) => lead.conversionStatus === 'lost').length;
    const totalValue = pipeline
      .filter((lead) => lead.conversionStatus === 'won')
      .reduce((sum, lead) => sum + (lead.conversionValue || 0), 0);

    return {
      periodDays: days,
      totals: {
        leadsInPipeline: pipeline.length,
        converted,
        won,
        lost,
        conversionRate: pipeline.length === 0 ? 0 : Number(((converted / pipeline.length) * 100).toFixed(2)),
        winRate: converted === 0 ? 0 : Number(((won / converted) * 100).toFixed(2)),
        totalWonValue: totalValue,
      },
      stageDistribution: this.countByStage(pipeline),
      topPipelineLeads: pipeline
        .sort((a, b) => b.score - a.score)
        .slice(0, 10),
    };
  }

  private async getLeadFromCrm(organizationId: string, crmLeadId: string) {
    const imported = await this.prisma.analyticsEvent.findFirst({
      where: {
        id: crmLeadId,
        organizationId,
        eventType: 'crm.lead.imported',
      },
    });

    if (!imported) {
      throw new NotFoundException('CRM lead not found');
    }

    const properties = this.parseProperties(imported.properties);
    const lead = properties.lead || {};
    return {
      crmLeadId,
      fullName: this.readString(lead.fullName),
      email: this.readString(lead.email),
      phone: this.readString(lead.phone),
      companyName: this.readString(lead.companyName),
    };
  }

  private async rebuildPipeline(organizationId: string, since?: Date): Promise<CrmPipelineLead[]> {
    const rows = await this.prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        eventType: {
          in: [
            'crm.lead.imported',
            'crm.pipeline.stage_changed',
            'crm.outreach.message_sent',
            'crm.conversion.marked',
          ],
        },
        ...(since ? { timestamp: { gte: since } } : {}),
      },
      orderBy: { timestamp: 'asc' },
      take: 10000,
    });

    const map = new Map<string, CrmPipelineLead>();

    for (const row of rows) {
      const props = this.parseProperties(row.properties);

      if (row.eventType === 'crm.lead.imported') {
        const crmLeadId = this.readString(props.crmLeadId) || row.id;
        const lead = props.lead || {};
        map.set(crmLeadId, {
          crmLeadId,
          sourceLeadEventId: this.readString(props.sourceLeadEventId),
          stage: this.readStage(props.stage),
          score: this.readNumber(props.score) ?? 50,
          fullName: this.readString(lead.fullName),
          email: this.readString(lead.email),
          phone: this.readString(lead.phone),
          companyName: this.readString(lead.companyName),
          source: this.readString(lead.source),
          notes: this.readString(props.notes),
          converted: false,
          lastActivityAt: row.timestamp.toISOString(),
          touches: 0,
        });
      }

      if (row.eventType === 'crm.pipeline.stage_changed') {
        const crmLeadId = this.readString(props.crmLeadId);
        if (!crmLeadId || !map.has(crmLeadId)) continue;
        const current = map.get(crmLeadId);
        if (!current) continue;

        current.stage = this.readStage(props.toStage);
        current.lastActivityAt = row.timestamp.toISOString();
        map.set(crmLeadId, current);
      }

      if (row.eventType === 'crm.outreach.message_sent') {
        const crmLeadId = this.readString(props.crmLeadId);
        if (!crmLeadId || !map.has(crmLeadId)) continue;
        const current = map.get(crmLeadId);
        if (!current) continue;

        current.touches += 1;
        current.lastActivityAt = row.timestamp.toISOString();
        map.set(crmLeadId, current);
      }

      if (row.eventType === 'crm.conversion.marked') {
        const crmLeadId = this.readString(props.crmLeadId);
        if (!crmLeadId || !map.has(crmLeadId)) continue;
        const current = map.get(crmLeadId);
        if (!current) continue;

        const status = this.readString(props.status) === 'won' ? 'won' : 'lost';
        current.converted = true;
        current.conversionStatus = status;
        current.conversionValue = this.readNumber(props.value) || 0;
        current.stage = status;
        current.lastActivityAt = row.timestamp.toISOString();
        map.set(crmLeadId, current);
      }
    }

    return Array.from(map.values());
  }

  private defaultSequence(fullName?: string): OutreachStepDto[] {
    return [
      {
        channel: 'email',
        subject: 'Quick growth idea for your team',
        message: `Hi ${fullName || 'there'}, I spotted a fast-win to lift qualified pipeline. Open to a 12-minute walk-through?`,
        delayHours: 0,
      },
      {
        channel: 'linkedin',
        message: 'Sharing a concise benchmark and one recommendation relevant to your market.',
        delayHours: 48,
      },
      {
        channel: 'email',
        subject: 'Should I close this file?',
        message: 'Circling back once. If improving conversion this quarter is still a priority, I can send a tailored mini-plan.',
        delayHours: 96,
      },
    ];
  }

  private parseProperties(raw?: string | null): Record<string, any> {
    if (!raw) return {};
    try {
      return JSON.parse(raw) as Record<string, any>;
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

  private readString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  private readNumber(value: unknown): number | undefined {
    return typeof value === 'number' ? value : undefined;
  }

  private readStage(value: unknown): CrmStage {
    const asString = this.readString(value);
    return CRM_STAGES.includes(asString as CrmStage) ? (asString as CrmStage) : 'new';
  }

  private scoreLead(prospect: Record<string, unknown>) {
    let score = 35;
    if (this.readString(prospect.email)) score += 12;
    if (this.readString(prospect.phone)) score += 8;
    if (this.readString(prospect.companyName)) score += 8;
    const revenue = this.readNumber(prospect.annualRevenue);
    if (revenue && revenue > 100000) score += 10;
    const companySize = this.readNumber(prospect.companySize);
    if (companySize && companySize >= 10 && companySize <= 1000) score += 12;
    return Math.max(0, Math.min(100, score));
  }

  private countByStage(leads: CrmPipelineLead[]) {
    const map = new Map<CrmStage, number>();
    for (const stage of CRM_STAGES) {
      map.set(stage, 0);
    }

    for (const lead of leads) {
      map.set(lead.stage, (map.get(lead.stage) || 0) + 1);
    }

    return Array.from(map.entries()).map(([stage, count]) => ({ stage, count }));
  }
}
