import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AIService } from '../ai/ai.service';
import { AIModel } from '../ai/types/ai.types';
import {
  AddFunnelStepDto,
  CaptureLeadDto,
  CompleteStepDto,
  CreateFormDto,
  CreateFunnelDto,
  FunnelListQueryDto,
  OptimizeConversionDto,
  SuggestFunnelStructureDto,
} from './dto/funnel-engine.dto';

@Injectable()
export class FunnelEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
  ) {}

  // ─── Forms ─────────────────────────────────────────────────────────────────

  async createForm(organizationId: string, userId: string, dto: CreateFormDto) {
    const event = await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'funnel.form.created',
        properties: JSON.stringify({
          name: dto.name,
          description: dto.description,
          fields: dto.fields,
          submitLabel: dto.submitLabel || 'Submit',
          redirectUrl: dto.redirectUrl,
          styling: dto.styling || {},
          createdAt: new Date().toISOString(),
        }),
      },
    });

    return this.mapForm(event);
  }

  async listForms(organizationId: string) {
    const events = await this.prisma.analyticsEvent.findMany({
      where: { organizationId, eventType: 'funnel.form.created' },
      orderBy: { timestamp: 'desc' },
      take: 200,
    });

    return events.map((e) => this.mapForm(e));
  }

  async getForm(organizationId: string, formId: string) {
    const event = await this.prisma.analyticsEvent.findFirst({
      where: { id: formId, organizationId, eventType: 'funnel.form.created' },
    });

    if (!event) throw new NotFoundException('Form not found');
    return this.mapForm(event);
  }

  // ─── Funnels ────────────────────────────────────────────────────────────────

  async createFunnel(organizationId: string, userId: string, dto: CreateFunnelDto) {
    const steps = (dto.steps || []).map((step, i) => ({
      ...step,
      stepIndex: i,
      stepId: `step_${Date.now()}_${i}`,
    }));

    const event = await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'funnel.created',
        properties: JSON.stringify({
          name: dto.name,
          goal: dto.goal || 'lead_capture',
          description: dto.description,
          targetAudience: dto.targetAudience,
          offerName: dto.offerName,
          steps,
          stepCount: steps.length,
          isActive: true,
          createdAt: new Date().toISOString(),
        }),
      },
    });

    return this.mapFunnel(event);
  }

  async listFunnels(organizationId: string, query: FunnelListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const events = await this.prisma.analyticsEvent.findMany({
      where: { organizationId, eventType: 'funnel.created' },
      orderBy: { timestamp: 'desc' },
      take: 300,
    });

    const mapped = events.map((e) => this.mapFunnel(e));
    const filtered = mapped.filter((f) => {
      const goalOk = query.goal ? f.goal === query.goal : true;
      const q = query.q?.toLowerCase();
      const qOk = q ? JSON.stringify(f).toLowerCase().includes(q) : true;
      return goalOk && qOk;
    });

    return {
      items: filtered.slice(skip, skip + limit),
      page,
      limit,
      total: filtered.length,
    };
  }

  async getFunnel(organizationId: string, funnelId: string) {
    const event = await this.prisma.analyticsEvent.findFirst({
      where: { id: funnelId, organizationId, eventType: 'funnel.created' },
    });

    if (!event) throw new NotFoundException('Funnel not found');

    const stats = await this.getFunnelConversionStats(organizationId, funnelId);
    return { ...this.mapFunnel(event), stats };
  }

  async addFunnelStep(organizationId: string, userId: string, funnelId: string, dto: AddFunnelStepDto) {
    const funnel = await this.prisma.analyticsEvent.findFirst({
      where: { id: funnelId, organizationId, eventType: 'funnel.created' },
    });

    if (!funnel) throw new NotFoundException('Funnel not found');

    const props = this.parse(funnel.properties);
    const steps = (props.steps as Array<Record<string, unknown>>) || [];
    const newStep = {
      ...dto,
      stepIndex: steps.length,
      stepId: `step_${Date.now()}_${steps.length}`,
      addedAt: new Date().toISOString(),
    };

    const updated = await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'funnel.step.added',
        properties: JSON.stringify({
          funnelId,
          step: newStep,
          totalSteps: steps.length + 1,
        }),
      },
    });

    return { funnelId, stepId: newStep.stepId, step: newStep, eventId: updated.id };
  }

  // ─── Lead Capture ───────────────────────────────────────────────────────────

  async captureLead(dto: CaptureLeadDto, organizationId?: string) {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const event = await this.prisma.analyticsEvent.create({
      data: {
        organizationId: organizationId || 'public',
        eventType: 'funnel.lead.captured',
        properties: JSON.stringify({
          funnelId: dto.funnelId,
          stepId: dto.stepId,
          formId: dto.formId,
          sessionId,
          contact: {
            fullName: dto.fullName,
            email: dto.email,
            phone: dto.phone,
            companyName: dto.companyName,
          },
          formData: dto.formData || {},
          attribution: {
            ipAddress: dto.ipAddress,
            userAgent: dto.userAgent,
            referrer: dto.referrer,
            utmSource: dto.utmSource,
            utmMedium: dto.utmMedium,
            utmCampaign: dto.utmCampaign,
          },
          capturedAt: new Date().toISOString(),
        }),
      },
    });

    return { sessionId, captureId: event.id, funnelId: dto.funnelId };
  }

  async completeStep(organizationId: string, userId: string, funnelId: string, dto: CompleteStepDto) {
    const funnel = await this.prisma.analyticsEvent.findFirst({
      where: { id: funnelId, organizationId, eventType: 'funnel.created' },
    });

    if (!funnel) throw new NotFoundException('Funnel not found');

    const event = await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'funnel.step.completed',
        properties: JSON.stringify({
          funnelId,
          stepId: dto.stepId,
          sessionId: dto.sessionId,
          metadata: dto.metadata || {},
          completedAt: new Date().toISOString(),
        }),
      },
    });

    const props = this.parse(funnel.properties);
    const steps = (props.steps as Array<{ stepId: string }>) || [];
    const stepIndex = steps.findIndex((s) => s.stepId === dto.stepId);
    const isLastStep = stepIndex === steps.length - 1 && steps.length > 0;

    if (isLastStep) {
      await this.prisma.analyticsEvent.create({
        data: {
          organizationId,
          userId,
          eventType: 'funnel.converted',
          properties: JSON.stringify({
            funnelId,
            sessionId: dto.sessionId,
            convertedAt: new Date().toISOString(),
          }),
        },
      });
    }

    return { eventId: event.id, funnelId, stepId: dto.stepId, converted: isLastStep };
  }

  // ─── AI ─────────────────────────────────────────────────────────────────────

  async optimizeConversion(organizationId: string, userId: string, dto: OptimizeConversionDto) {
    const funnel = await this.prisma.analyticsEvent.findFirst({
      where: { id: dto.funnelId, organizationId, eventType: 'funnel.created' },
    });

    if (!funnel) throw new NotFoundException('Funnel not found');

    const props = this.parse(funnel.properties);
    const stats = await this.getFunnelConversionStats(organizationId, dto.funnelId);

    const prompt = `You are an expert growth and conversion rate optimization specialist.
Funnel: ${JSON.stringify({ name: props.name, goal: props.goal, steps: props.steps })}
Current stats: ${JSON.stringify(stats)}
Focus area: ${dto.focusArea || 'overall conversion rate'}

Return strict JSON with keys: overallScore (0-100), topIssues (array of strings), quickWins (array), suggestions (array of {step, issue, recommendation, expectedLift}).
Return ONLY JSON.`;

    try {
      const ai = await this.aiService.generateText(
        { prompt, model: AIModel.GPT_4_TURBO, temperature: 0.3, maxTokens: 600 },
        organizationId,
        userId,
        { type: 'best_quality' },
        true,
      );

      const analysis = this.safeJson(ai.text);

      await this.prisma.analyticsEvent.create({
        data: {
          organizationId,
          userId,
          eventType: 'funnel.ai.optimized',
          properties: JSON.stringify({
            funnelId: dto.funnelId,
            focusArea: dto.focusArea,
            analysis,
            generatedAt: new Date().toISOString(),
          }),
        },
      });

      return { funnelId: dto.funnelId, analysis };
    } catch {
      return {
        funnelId: dto.funnelId,
        analysis: {
          overallScore: 60,
          topIssues: ['Low form completion rate', 'High exit rate on capture step'],
          quickWins: ['Reduce form fields to 3 max', 'Add social proof above CTA', 'Use urgency trigger'],
          suggestions: [
            {
              step: 'capture',
              issue: 'Too many required fields',
              recommendation: 'Ask only for first name and email, collect rest in follow-up',
              expectedLift: '+12–18% completion',
            },
          ],
        },
      };
    }
  }

  async suggestFunnelStructure(organizationId: string, userId: string, dto: SuggestFunnelStructureDto) {
    const prompt = `You are a high-converting funnel architect.
Goal: ${dto.goal}
Product: ${dto.product || 'SaaS platform'}
Audience: ${dto.audience || 'B2B decision-makers'}
Price point: ${dto.pricePoint || 'mid-market'}
Industry: ${dto.industry || 'general'}
Max steps: ${dto.stepCount || 5}

Return strict JSON: { rationale, steps: [{ type, name, headline, subheadline, ctaText, keyElement }], estimatedCvr }
Return ONLY JSON.`;

    try {
      const ai = await this.aiService.generateText(
        { prompt, model: AIModel.GPT_4_TURBO, temperature: 0.4, maxTokens: 700 },
        organizationId,
        userId,
        { type: 'best_quality' },
        true,
      );

      const suggestion = this.safeJson(ai.text);

      await this.prisma.analyticsEvent.create({
        data: {
          organizationId,
          userId,
          eventType: 'funnel.ai.suggestion',
          properties: JSON.stringify({
            input: dto,
            suggestion,
            generatedAt: new Date().toISOString(),
          }),
        },
      });

      return { suggestion };
    } catch {
      return {
        suggestion: {
          rationale: 'Classic lead magnet → nurture → demo booking funnel optimised for B2B SaaS.',
          estimatedCvr: '4–7%',
          steps: [
            { type: 'landing', name: 'Hook Page', headline: 'Double Your Pipeline in 30 Days', ctaText: 'Get Free Audit', keyElement: 'Pain + outcome headline' },
            { type: 'capture', name: 'Lead Capture', headline: 'Where Should We Send Your Growth Plan?', ctaText: 'Send My Plan', keyElement: '2-field form + trust badges' },
            { type: 'thankyou', name: 'Thank You + Book Call', headline: 'Your Plan Is On Its Way!', ctaText: 'Book Your Strategy Call', keyElement: 'Embedded calendar + urgency' },
          ],
        },
      };
    }
  }

  // ─── Analytics ──────────────────────────────────────────────────────────────

  async getStats(organizationId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        eventType: {
          in: [
            'funnel.created',
            'funnel.lead.captured',
            'funnel.step.completed',
            'funnel.converted',
            'funnel.form.created',
          ],
        },
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'desc' },
      take: 20000,
    });

    const funnels = events.filter((e) => e.eventType === 'funnel.created').length;
    const forms = events.filter((e) => e.eventType === 'funnel.form.created').length;
    const captures = events.filter((e) => e.eventType === 'funnel.lead.captured').length;
    const stepCompletions = events.filter((e) => e.eventType === 'funnel.step.completed').length;
    const conversions = events.filter((e) => e.eventType === 'funnel.converted').length;

    const capturesByFunnel = new Map<string, number>();
    for (const e of events.filter((ev) => ev.eventType === 'funnel.lead.captured')) {
      const p = this.parse(e.properties);
      const fid = (p.funnelId as string) || 'unknown';
      capturesByFunnel.set(fid, (capturesByFunnel.get(fid) || 0) + 1);
    }

    const capturesByUtmSource = new Map<string, number>();
    for (const e of events.filter((ev) => ev.eventType === 'funnel.lead.captured')) {
      const p = this.parse(e.properties);
      const src = ((p.attribution as any)?.utmSource as string) || 'direct';
      capturesByUtmSource.set(src, (capturesByUtmSource.get(src) || 0) + 1);
    }

    return {
      periodDays: days,
      totals: {
        funnels,
        forms,
        captures,
        stepCompletions,
        conversions,
        overallConversionRate: captures === 0 ? 0 : Number(((conversions / captures) * 100).toFixed(2)),
      },
      topFunnels: Array.from(capturesByFunnel.entries())
        .map(([funnelId, count]) => ({ funnelId, captures: count }))
        .sort((a, b) => b.captures - a.captures)
        .slice(0, 5),
      byUtmSource: Array.from(capturesByUtmSource.entries()).map(([source, count]) => ({ source, count })),
    };
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async getFunnelConversionStats(organizationId: string, funnelId: string) {
    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        eventType: { in: ['funnel.lead.captured', 'funnel.step.completed', 'funnel.converted'] },
        properties: { contains: funnelId },
      },
      orderBy: { timestamp: 'desc' },
      take: 5000,
    });

    const captures = events.filter((e) => e.eventType === 'funnel.lead.captured').length;
    const conversions = events.filter((e) => e.eventType === 'funnel.converted').length;
    const stepMap = new Map<string, number>();

    for (const e of events.filter((ev) => ev.eventType === 'funnel.step.completed')) {
      const p = this.parse(e.properties);
      const sid = (p.stepId as string) || 'unknown';
      stepMap.set(sid, (stepMap.get(sid) || 0) + 1);
    }

    return {
      captures,
      conversions,
      conversionRate: captures === 0 ? 0 : Number(((conversions / captures) * 100).toFixed(2)),
      byStep: Array.from(stepMap.entries()).map(([stepId, completions]) => ({ stepId, completions })),
    };
  }

  private mapFunnel(event: { id: string; properties: string | null; timestamp: Date }) {
    const p = this.parse(event.properties);
    return {
      id: event.id,
      name: p.name,
      goal: p.goal,
      description: p.description,
      targetAudience: p.targetAudience,
      offerName: p.offerName,
      steps: p.steps || [],
      stepCount: p.stepCount || 0,
      isActive: p.isActive ?? true,
      createdAt: event.timestamp,
    };
  }

  private mapForm(event: { id: string; properties: string | null; timestamp: Date }) {
    const p = this.parse(event.properties);
    return {
      id: event.id,
      name: p.name,
      description: p.description,
      fields: p.fields || [],
      submitLabel: p.submitLabel || 'Submit',
      redirectUrl: p.redirectUrl,
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
}
