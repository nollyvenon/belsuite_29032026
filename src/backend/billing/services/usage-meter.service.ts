import { Injectable, Logger } from '@nestjs/common';
import { PrismaService }       from '../../database/prisma.service';
import { CreditService }       from './credit.service';
import { PricingEngineService } from './pricing-engine.service';
import { UsageFeature, CreditTxType } from '@prisma/client';

export interface MeterEvent {
  organizationId:  string;
  userId?:         string;
  feature:         UsageFeature;
  model?:          string;
  provider?:       string;
  inputTokens?:    number;
  outputTokens?:   number;
  videoMinutes?:   number;
  imageCount?:     number;
  smsCount?:       number;
  emailCount?:     number;
  storageGb?:      number;
  apiCalls?:       number;
  requestId?:      string;
  conversationId?: string;
  taskId?:         string;
  meta?:           Record<string, any>;
}

export interface MeterResult {
  usageRecordId:  string;
  creditsCharged: number;
  usdEquivalent:  number;
  providerCostUsd: number;
}

@Injectable()
export class UsageMeterService {
  private readonly logger = new Logger(UsageMeterService.name);

  constructor(
    private readonly prisma:   PrismaService,
    private readonly credits:  CreditService,
    private readonly pricing:  PricingEngineService,
  ) {}

  /**
   * Record a usage event and charge credits atomically.
   * Returns undefined if org has insufficient credits (soft failure for non-critical features).
   */
  async meter(event: MeterEvent, softFail = false): Promise<MeterResult | null> {
    const cost = await this.pricing.calculate(event);

    const totalTokens = (event.inputTokens ?? 0) + (event.outputTokens ?? 0);

    // Write usage record first (always — for analytics)
    const record = await this.prisma.usageRecord.create({
      data: {
        organizationId:  event.organizationId,
        userId:          event.userId,
        feature:         event.feature,
        model:           event.model,
        provider:        event.provider,
        inputTokens:     event.inputTokens  ?? 0,
        outputTokens:    event.outputTokens ?? 0,
        totalTokens,
        videoMinutes:    event.videoMinutes ?? 0,
        imageCount:      event.imageCount   ?? 0,
        smsCount:        event.smsCount     ?? 0,
        emailCount:      event.emailCount   ?? 0,
        storageGb:       event.storageGb    ?? 0,
        apiCalls:        event.apiCalls     ?? 1,
        providerCostUsd: cost.providerCostUsd,
        marginPct:       cost.marginPct,
        creditsCost:     cost.creditsCharged,
        usdEquivalent:   cost.usdEquivalent,
        requestId:       event.requestId,
        conversationId:  event.conversationId,
        taskId:          event.taskId,
        meta:            event.meta ?? {},
      },
    });

    // Debit credits
    if (cost.creditsCharged > 0) {
      try {
        await this.credits.debit({
          organizationId: event.organizationId,
          userId:         event.userId,
          feature:        event.feature,
          credits:        cost.creditsCharged,
          description:    `${event.feature}${event.model ? ` (${event.model})` : ''}`,
          usageRecordId:  record.id,
          meta:           { providerCostUsd: cost.providerCostUsd },
        });
      } catch (err) {
        if (softFail) {
          this.logger.warn(`Soft-fail credit debit for org ${event.organizationId}: ${err}`);
          return { usageRecordId: record.id, creditsCharged: 0, usdEquivalent: 0, providerCostUsd: cost.providerCostUsd };
        }
        throw err;
      }
    }

    return {
      usageRecordId:   record.id,
      creditsCharged:  cost.creditsCharged,
      usdEquivalent:   cost.usdEquivalent,
      providerCostUsd: cost.providerCostUsd,
    };
  }

  // ── Analytics queries ────────────────────────────────────────────────────

  async getUsageSummary(
    organizationId: string,
    from: Date,
    to:   Date,
  ) {
    const records = await this.prisma.usageRecord.groupBy({
      by:    ['feature'],
      where: { organizationId, createdAt: { gte: from, lte: to } },
      _sum:  {
        creditsCost:     true,
        usdEquivalent:   true,
        providerCostUsd: true,
        totalTokens:     true,
        videoMinutes:    true,
        imageCount:      true,
        smsCount:        true,
        emailCount:      true,
        apiCalls:        true,
      },
      _count: { id: true },
    });
    return records;
  }

  async getModelBreakdown(organizationId: string, from: Date, to: Date) {
    return this.prisma.usageRecord.groupBy({
      by:    ['model', 'provider'],
      where: { organizationId, createdAt: { gte: from, lte: to }, model: { not: null } },
      _sum:  { creditsCost: true, usdEquivalent: true, providerCostUsd: true, totalTokens: true },
      _count: { id: true },
      orderBy: { _sum: { creditsCost: 'desc' } },
    });
  }

  async getDailyUsage(organizationId: string, from: Date, to: Date) {
    // Raw query for daily grouping
    return this.prisma.$queryRaw`
      SELECT
        DATE(created_at) as date,
        SUM(credits_cost)      as total_credits,
        SUM(usd_equivalent)    as total_usd,
        SUM(provider_cost_usd) as provider_cost,
        COUNT(*)               as request_count
      FROM usage_records
      WHERE organization_id = ${organizationId}
        AND created_at BETWEEN ${from} AND ${to}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
  }

  async getTopOrgsUsage(from: Date, to: Date, limit = 20) {
    return this.prisma.usageRecord.groupBy({
      by:    ['organizationId'],
      where: { createdAt: { gte: from, lte: to } },
      _sum:  { creditsCost: true, usdEquivalent: true, providerCostUsd: true },
      _count: { id: true },
      orderBy: { _sum: { creditsCost: 'desc' } },
      take:  limit,
    });
  }

  async getRecentEvents(organizationId: string, limit = 50) {
    return this.prisma.usageRecord.findMany({
      where:   { organizationId },
      orderBy: { createdAt: 'desc' },
      take:    limit,
    });
  }

  // ── Cost margin report (admin) ────────────────────────────────────────────

  async getMarginReport(from: Date, to: Date) {
    const result = await this.prisma.usageRecord.aggregate({
      where: { createdAt: { gte: from, lte: to } },
      _sum:  { providerCostUsd: true, usdEquivalent: true, creditsCost: true },
      _count: { id: true },
    });

    const revenue = result._sum.usdEquivalent ?? 0;
    const cost    = result._sum.providerCostUsd ?? 0;
    const margin  = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;

    return {
      totalRevenue:    revenue,
      totalCost:       cost,
      grossProfit:     revenue - cost,
      marginPct:       margin,
      totalRequests:   result._count.id,
      totalCredits:    result._sum.creditsCost ?? 0,
    };
  }
}
