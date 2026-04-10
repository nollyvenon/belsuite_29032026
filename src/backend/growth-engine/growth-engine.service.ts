import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import {
  Lead,
  Contact,
  Deal,
  MarketingCampaign,
  LeadAnalytics,
  CampaignAnalytics,
  CRMAnalytics,
  GrowthEngineStats,
  LeadGrade,
  LeadStatus,
  LEAD_SCORING_WEIGHTS,
} from '../../types/growth-engine.types';

/**
 * Growth Engine Service - Orchestrates all growth platform features
 * Lead generation, CRM, marketing automation, SEO
 */
@Injectable()
export class GrowthEngineService {
  private readonly logger = new Logger(GrowthEngineService.name);

  constructor(private prisma: PrismaService, private config: ConfigService) {}

  // ── LEAD GENERATION ─────────────────────────────────────────────────────

  /**
   * Get all leads for organization with filtering & pagination
   */
  async getLeads(
    organizationId: string,
    filters: {
      status?: string;
      sourceId?: string;
      minScore?: number;
      tags?: string[];
      limit?: number;
      offset?: number;
    },
  ): Promise<{ leads: Lead[]; total: number }> {
    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where: {
          organizationId,
          ...(filters.status && { status: filters.status }),
          ...(filters.sourceId && { sourceId: filters.sourceId }),
          ...(filters.minScore && { leadScore: { gte: filters.minScore } }),
          ...(filters.tags && { tags: { hasSome: filters.tags } }),
        },
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: { leadScore: 'desc' },
      }),
      this.prisma.lead.count({
        where: {
          organizationId,
          ...(filters.status && { status: filters.status }),
          ...(filters.sourceId && { sourceId: filters.sourceId }),
        },
      }),
    ]);

    return { leads: leads as any, total };
  }

  /**
   * Score a lead based on engagement and data quality
   */
  async scoreLead(leadId: string): Promise<number> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { activities: true },
    } as any);

    if (!lead) return 0;

    let score = 0;

    // Data quality scoring
    if (lead.verificationStatus === 'VERIFIED') score += LEAD_SCORING_WEIGHTS.EMAIL_VERIFIED;
    if (lead.company) score += LEAD_SCORING_WEIGHTS.COMPANY_VERIFIED;
    if (lead.jobTitle) score += LEAD_SCORING_WEIGHTS.JOB_TITLE_VERIFIED;

    // Engagement scoring
    score += lead.pageViews * LEAD_SCORING_WEIGHTS.PAGE_VIEW;

    // Activity scoring
    const activities = lead.activities || [];
    activities.forEach((activity: any) => {
      if (activity.type === 'EMAIL' && activity.result === 'positive')
        score += LEAD_SCORING_WEIGHTS.EMAIL_OPENED;
      if (activity.type === 'EMAIL' && activity.result === 'clicked')
        score += LEAD_SCORING_WEIGHTS.LINK_CLICKED;
      if (activity.type === 'FORM_SUBMISSION') score += LEAD_SCORING_WEIGHTS.FORM_SUBMISSION;
      if (activity.type === 'MEETING') score += LEAD_SCORING_WEIGHTS.MEETING_SCHEDULED;
    });

    // Cap at 100
    score = Math.min(100, score);

    // Update lead with new score and grade
    const grade = this.calculateLeadGrade(score);
    await this.prisma.lead.update({
      where: { id: leadId },
      data: { leadScore: score, leadGrade: grade as any },
    } as any);

    return score;
  }

  private calculateLeadGrade(score: number): LeadGrade {
    if (score >= 80) return LeadGrade.A;
    if (score >= 60) return LeadGrade.B;
    if (score >= 40) return LeadGrade.C;
    if (score >= 20) return LeadGrade.D;
    return LeadGrade.F;
  }

  /**
   * Enrich lead with external data
   */
  async enrichLead(leadId: string, providers?: string[]): Promise<any> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    } as any);

    if (!lead) throw new Error('Lead not found');

    // Update status to enriching
    await this.prisma.lead.update({
      where: { id: leadId },
      data: { enrichmentStatus: 'ENRICHING' },
    } as any);

    // Queue enrichment job asynchronously
    this.queueEnrichment(lead, providers).catch(err =>
      this.logger.error(`Enrichment failed for lead ${leadId}: ${err.message}`),
    );

    return { leadId, status: 'ENRICHING' };
  }

  private async queueEnrichment(lead: any, providers?: string[]): Promise<void> {
    const enrichmentData: Record<string, any> = {};

    // Call enrichment APIs (Clearbit, Hunter, RocketReach, etc.)
    if (!providers || providers.includes('clearbit')) {
      const clearbitData = await this.callClearbit(lead.email);
      enrichmentData.clearbit = clearbitData;
    }

    if (!providers || providers.includes('hunter')) {
      const hunterData = await this.callHunter(lead.email, lead.company);
      enrichmentData.hunter = hunterData;
    }

    // Update lead with enrichment results
    await this.prisma.lead.update({
      where: { id: lead.id },
      data: {
        enrichmentStatus: 'COMPLETED',
        enrichmentData: enrichmentData as any,
      },
    } as any);

    this.logger.log(`Enriched lead: ${lead.id}`);
  }

  private async callClearbit(email: string): Promise<any> {
    // TODO: Implement Clearbit API call
    // const apiKey = this.config.get('CLEARBIT_API_KEY');
    // return axios.get(`https://person.clearbit.com/v2/combined/find?email=${email}`, ...);
    return { success: true };
  }

  private async callHunter(email: string, company?: string): Promise<any> {
    // TODO: Implement Hunter API call
    // const apiKey = this.config.get('HUNTER_API_KEY');
    return { success: true };
  }

  // ── CRM ──────────────────────────────────────────────────────────────────

  /**
   * Get all contacts
   */
  async getContacts(
    organizationId: string,
    filters: {
      status?: string;
      tags?: string[];
      limit?: number;
      offset?: number;
    },
  ): Promise<{ contacts: Contact[]; total: number }> {
    const [contacts, total] = await Promise.all([
      this.prisma.contact.findMany({
        where: {
          organizationId,
          ...(filters.status && { status: filters.status }),
          ...(filters.tags && { tags: { hasSome: filters.tags } }),
        },
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: { score: 'desc' },
      }),
      this.prisma.contact.count({
        where: { organizationId },
      }),
    ]);

    return { contacts: contacts as any, total };
  }

  /**
   * Get deals in pipeline
   */
  async getDeals(
    organizationId: string,
    filters: {
      stage?: string;
      ownerId?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ deals: Deal[]; total: number }> {
    const [deals, total] = await Promise.all([
      this.prisma.deal.findMany({
        where: {
          organizationId,
          ...(filters.stage && { stage: filters.stage }),
          ...(filters.ownerId && { ownerId: filters.ownerId }),
        },
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: { amount: 'desc' },
      }),
      this.prisma.deal.count({
        where: { organizationId },
      }),
    ]);

    return { deals: deals as any, total };
  }

  /**
   * Calculate pipeline value by stage
   */
  async getPipelineValue(organizationId: string): Promise<Record<string, number>> {
    const deals = await this.prisma.deal.findMany({
      where: { organizationId },
      select: { stage: true, amount: true, probability: true },
    } as any);

    const pipelineByStage: Record<string, number> = {};

    deals.forEach((deal: any) => {
      if (!pipelineByStage[deal.stage]) pipelineByStage[deal.stage] = 0;
      const expectedValue = deal.amount * (deal.probability / 100);
      pipelineByStage[deal.stage] += expectedValue;
    });

    return pipelineByStage;
  }

  // ── MARKETING CAMPAIGNS ─────────────────────────────────────────────────

  /**
   * Get all campaigns
   */
  async getCampaigns(
    organizationId: string,
    filters: {
      type?: string;
      status?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ campaigns: MarketingCampaign[]; total: number }> {
    const [campaigns, total] = await Promise.all([
      this.prisma.marketingCampaign.findMany({
        where: {
          organizationId,
          ...(filters.type && { campaignType: filters.type }),
          ...(filters.status && { status: filters.status }),
        },
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.marketingCampaign.count({
        where: { organizationId },
      }),
    ]);

    return { campaigns: campaigns as any, total };
  }

  /**
   * Launch a campaign to recipients
   */
  async launchCampaign(campaignId: string, recipientIds: string[]): Promise<any> {
    const campaign = await this.prisma.marketingCampaign.findUnique({
      where: { id: campaignId },
    } as any);

    if (!campaign) throw new Error('Campaign not found');

    // Create campaign recipients
    await this.prisma.campaignRecipient.createMany({
      data: recipientIds.map(recipientId => ({
        campaignId,
        leadId: recipientId,
        status: 'SCHEDULED',
      })),
    } as any);

    // Queue sending job
    await this.queueCampaignSend(campaignId).catch(err =>
      this.logger.error(`Campaign send failed: ${err.message}`),
    );

    return { campaignId, recipientsQueued: recipientIds.length };
  }

  private async queueCampaignSend(campaignId: string): Promise<void> {
    // TODO: Implement campaign sending logic
    // - Get campaign template
    // - Get all recipients
    // - Send emails/SMS/calls
    // - Track opens, clicks, responses

    this.logger.log(`Campaign ${campaignId} queued for sending`);
  }

  // ── AUTOMATION WORKFLOWS ────────────────────────────────────────────────

  /**
   * Execute workflow step
   */
  async executeWorkflowStep(workflowId: string, stepId: string, context: Record<string, any>): Promise<any> {
    const workflow = await this.prisma.automationWorkflow.findUnique({
      where: { id: workflowId },
      include: { steps: true },
    } as any);

    if (!workflow) throw new Error('Workflow not found');

    const step = workflow.steps?.find((s: any) => s.id === stepId);
    if (!step) throw new Error('Step not found');

    // Execute based on step type
    switch (step.type) {
      case 'SEND_EMAIL':
        return this.sendWorkflowEmail(step, context);
      case 'SEND_SMS':
        return this.sendWorkflowSMS(step, context);
      case 'MAKE_CALL':
        return this.initiateWorkflowCall(step, context);
      case 'ADD_TAG':
        return this.addTagToContext(step, context);
      case 'UPDATE_SCORE':
        return this.updateLeadScore(step, context);
      case 'DELAY':
        return this.scheduleNextStep(step, context);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private async sendWorkflowEmail(step: any, context: Record<string, any>): Promise<any> {
    // TODO: Send email via SendGrid, Mailgun, etc.
    this.logger.log(`Sending email for workflow step: ${step.id}`);
    return { sent: true };
  }

  private async sendWorkflowSMS(step: any, context: Record<string, any>): Promise<any> {
    // TODO: Send SMS via Twilio, Vonage, etc.
    this.logger.log(`Sending SMS for workflow step: ${step.id}`);
    return { sent: true };
  }

  private async initiateWorkflowCall(step: any, context: Record<string, any>): Promise<any> {
    // TODO: Initiate AI call
    this.logger.log(`Initiating call for workflow step: ${step.id}`);
    return { callInitiated: true };
  }

  private async addTagToContext(step: any, context: Record<string, any>): Promise<any> {
    const { leadId, tag } = step.config;
    if (context.leadId) {
      await this.prisma.lead.update({
        where: { id: context.leadId },
        data: { tags: { push: tag } },
      } as any);
    }
    return { tagAdded: true };
  }

  private async updateLeadScore(step: any, context: Record<string, any>): Promise<any> {
    const { increment } = step.config;
    if (context.leadId) {
      const lead = await this.prisma.lead.findUnique({
        where: { id: context.leadId },
      } as any);

      if (lead) {
        const newScore = Math.min(100, lead.leadScore + increment);
        await this.prisma.lead.update({
          where: { id: context.leadId },
          data: { leadScore: newScore },
        } as any);
      }
    }
    return { scoreUpdated: true };
  }

  private async scheduleNextStep(step: any, context: Record<string, any>): Promise<any> {
    const { delayMinutes } = step.config;
    // TODO: Schedule next workflow step execution
    this.logger.log(`Scheduling next step in ${delayMinutes} minutes`);
    return { scheduled: true };
  }

  // ── ANALYTICS & REPORTING ───────────────────────────────────────────────

  /**
   * Get comprehensive growth engine statistics
   */
  async getGrowthStats(organizationId: string): Promise<GrowthEngineStats> {
    const [
      leadStats,
      campaignStats,
      crmStats,
      seoStats,
    ] = await Promise.all([
      this.getLeadAnalytics(organizationId),
      this.getCampaignAnalytics(organizationId),
      this.getCRMAnalytics(organizationId),
      this.getSEOAnalytics(organizationId),
    ]);

    return {
      leads: leadStats,
      campaigns: campaignStats,
      crm: crmStats,
      seo: seoStats,
    };
  }

  private async getLeadAnalytics(organizationId: string): Promise<LeadAnalytics> {
    const leads = await this.prisma.lead.findMany({
      where: { organizationId },
    } as any);

    const qualifiedLeads = leads.filter(
      (l: any) => l.leadGrade === 'A' || l.leadGrade === 'B',
    ).length;
    const convertedLeads = leads.filter((l: any) => l.status === 'CONVERTED').length;

    return {
      totalLeads: leads.length,
      qualifiedLeads,
      conversionRate: leads.length ? (convertedLeads / leads.length) * 100 : 0,
      averageLeadScore: leads.length ? leads.reduce((sum, l: any) => sum + l.leadScore, 0) / leads.length : 0,
      sourceBreakdown: {},
      statusBreakdown: {
        NEW: leads.filter((l: any) => l.status === 'NEW').length,
        CONTACTED: leads.filter((l: any) => l.status === 'CONTACTED').length,
        QUALIFIED: leads.filter((l: any) => l.status === 'QUALIFIED').length,
        NURTURING: leads.filter((l: any) => l.status === 'NURTURING').length,
        CONVERTED: convertedLeads,
        LOST: leads.filter((l: any) => l.status === 'LOST').length,
        UNSUBSCRIBED: leads.filter((l: any) => l.status === 'UNSUBSCRIBED').length,
      } as any,
      enrichmentRate: leads.filter((l: any) => l.enrichmentStatus === 'COMPLETED').length / (leads.length || 1),
      verificationRate: leads.filter((l: any) => l.verificationStatus === 'VERIFIED').length / (leads.length || 1),
      topSources: [],
      trendData: [],
    };
  }

  private async getCampaignAnalytics(organizationId: string): Promise<CampaignAnalytics> {
    const campaigns = await this.prisma.marketingCampaign.findMany({
      where: { organizationId },
    } as any);

    const activeCampaigns = campaigns.filter((c: any) => c.status === 'RUNNING').length;
    const totalSent = campaigns.reduce((sum, c: any) => sum + c.sentCount, 0);
    const totalResponses = campaigns.reduce((sum, c: any) => sum + c.responseCount, 0);
    const totalRevenue = campaigns.reduce((sum, c: any) => sum + c.revenue, 0);

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns,
      averageOpenRate:
        campaigns.length > 0
          ? campaigns.reduce((sum, c: any) => sum + (c.openCount / (c.sentCount || 1)) * 100, 0) /
            campaigns.length
          : 0,
      averageClickRate:
        campaigns.length > 0
          ? campaigns.reduce((sum, c: any) => sum + (c.clickCount / (c.sentCount || 1)) * 100, 0) /
            campaigns.length
          : 0,
      averageConversionRate:
        campaigns.length > 0
          ? campaigns.reduce((sum, c: any) => sum + (c.conversionCount / (c.sentCount || 1)) * 100, 0) /
            campaigns.length
          : 0,
      totalSent,
      totalResponses,
      totalRevenue,
      roi: campaigns.reduce((sum, c: any) => sum + c.roi, 0) / (campaigns.length || 1),
    };
  }

  private async getCRMAnalytics(organizationId: string): Promise<CRMAnalytics> {
    const [deals, contacts] = await Promise.all([
      this.prisma.deal.findMany({ where: { organizationId } }),
      this.prisma.contact.findMany({ where: { organizationId } }),
    ] as any);

    const wonDeals = deals.filter((d: any) => d.stage === 'WON');
    const totalDealValue = deals.reduce((sum, d: any) => sum + d.amount, 0);
    const winRate = deals.length ? (wonDeals.length / deals.length) * 100 : 0;

    return {
      totalContacts: contacts.length,
      totalDeals: deals.length,
      dealValue: totalDealValue,
      winRate,
      averageDealSize: deals.length ? totalDealValue / deals.length : 0,
      pipelineByStage: {},
      conversionFunnel: [],
      topOwners: [],
    };
  }

  private async getSEOAnalytics(organizationId: string): Promise<any> {
    const [posts, backlinks] = await Promise.all([
      this.prisma.blogPost.findMany({ where: { organizationId } }),
      this.prisma.backlink.findMany({ where: { organizationId } }),
    ] as any);

    return {
      totalPosts: posts.length,
      totalBacklinks: backlinks.length,
      avgSeoScore: posts.length ? posts.reduce((sum, p: any) => sum + p.seoScore, 0) / posts.length : 0,
      rankedKeywords: posts.reduce((sum, p: any) => sum + (p.ranking ? 1 : 0), 0),
    };
  }
}
