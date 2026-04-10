/**
 * Usage Tracker Service
 * Tracks every gateway request in AIGatewayRequest.
 * Enforces budget limits per org and globally.
 * Exposes usage reports for admin dashboard.
 */

import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  BudgetStatus,
  UsageReport,
  DailyUsage,
  GatewayResponse,
  GatewayRequest,
} from '../types/gateway.types';

@Injectable()
export class UsageTrackerService {
  private readonly logger = new Logger(UsageTrackerService.name);

  constructor(private prisma: PrismaService) {}

  // ── Budget enforcement ─────────────────────────────────────────────────

  /**
   * Resolve the effective budget config for an org.
   * Priority: org-specific → plan-tier default → global default
   */
  private async resolveConfig(organizationId: string): Promise<any | null> {
    // 1. Org-specific override
    const orgConfig = await this.prisma.aIBudgetConfig.findFirst({
      where: { organizationId, isActive: true },
    });
    if (orgConfig) return orgConfig;

    // 2. Plan-tier default — look up the org's current plan
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { tier: true },
    });
    if (org?.tier) {
      const planConfig = await this.prisma.aIBudgetConfig.findFirst({
        where: { planTier: org.tier, organizationId: null, isActive: true },
      });
      if (planConfig) return planConfig;
    }

    // 3. Global default
    return this.prisma.aIBudgetConfig.findFirst({
      where: { organizationId: null, planTier: null, isActive: true },
    });
  }

  async checkBudget(organizationId: string, estimatedCostUsd: number): Promise<void> {
    const config = await this.resolveConfig(organizationId);
    if (!config) return;

    // Per-request cap (checked before the call is made)
    if (config.perRequestLimitUsd && estimatedCostUsd > config.perRequestLimitUsd) {
      throw new ForbiddenException(
        `Request cost ($${estimatedCostUsd.toFixed(4)}) exceeds ` +
        `per-request limit ($${config.perRequestLimitUsd}) — ` +
        `scope: ${config.organizationId ? 'org' : config.planTier ? `plan:${config.planTier}` : 'global'}`,
      );
    }

    const { dailySpendUsd, monthlySpendUsd } = await this.getSpend(organizationId);

    if (config.blockOnExceed) {
      if (config.dailyLimitUsd && dailySpendUsd >= config.dailyLimitUsd) {
        throw new ForbiddenException(
          `Daily AI budget exceeded ($${dailySpendUsd.toFixed(2)} / $${config.dailyLimitUsd})`,
        );
      }
      if (config.monthlyLimitUsd && monthlySpendUsd >= config.monthlyLimitUsd) {
        throw new ForbiddenException(
          `Monthly AI budget exceeded ($${monthlySpendUsd.toFixed(2)} / $${config.monthlyLimitUsd})`,
        );
      }
    }

    // Threshold alert
    const alertPct = config.alertThresholdPct ?? 80;
    if (config.monthlyLimitUsd) {
      const pct = (monthlySpendUsd / config.monthlyLimitUsd) * 100;
      if (pct >= alertPct) {
        this.logger.warn(
          `Budget alert: org ${organizationId} at ${pct.toFixed(0)}% of monthly limit ` +
          `(scope: ${config.planTier ?? 'global'})`,
        );
      }
    }
  }

  async getBudgetStatus(organizationId: string): Promise<BudgetStatus> {
    const config = await this.resolveConfig(organizationId);
    const { dailySpendUsd, monthlySpendUsd } = await this.getSpend(organizationId);

    const dailyPct   = config?.dailyLimitUsd   ? (dailySpendUsd   / config.dailyLimitUsd)   * 100 : 0;
    const monthlyPct = config?.monthlyLimitUsd ? (monthlySpendUsd / config.monthlyLimitUsd) * 100 : 0;
    const alertPct   = config?.alertThresholdPct ?? 80;

    return {
      organizationId,
      dailySpendUsd,
      monthlySpendUsd,
      dailyLimitUsd:   config?.dailyLimitUsd   ?? undefined,
      monthlyLimitUsd: config?.monthlyLimitUsd ?? undefined,
      dailyPct:   Math.min(dailyPct,   100),
      monthlyPct: Math.min(monthlyPct, 100),
      isBlocked:     config?.blockOnExceed
        ? (dailyPct >= 100 || monthlyPct >= 100)
        : false,
      alertTriggered: dailyPct >= alertPct || monthlyPct >= alertPct,
    };
  }

  // ── Request tracking ───────────────────────────────────────────────────

  async trackRequest(
    req: GatewayRequest,
    res: GatewayResponse,
    modelDbId: string,
    latencyMs: number,
  ): Promise<void> {
    try {
      await this.prisma.aIGatewayRequest.create({
        data: {
          organizationId: req.organizationId,
          userId:         req.userId ?? null,
          feature:        req.feature,
          taskType:       req.task,
          modelId:        modelDbId,
          provider:       res.provider,
          inputTokens:    res.tokens.input,
          outputTokens:   res.tokens.output,
          totalTokens:    res.tokens.total,
          costUsd:        res.costUsd,
          latencyMs,
          cacheHit:       res.cacheHit,
          failoverUsed:   res.failoverUsed,
          failoverFrom:   res.failoverChain?.[0] ?? null,
          success:        true,
          promptHash:     res.requestId,
          metadata:       req.metadata as any ?? undefined,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to track request: ${String(err)}`);
    }
  }

  async trackFailedRequest(
    req: GatewayRequest,
    modelDbId: string,
    provider: string,
    errorCode: string,
    errorMessage: string,
  ): Promise<void> {
    try {
      await this.prisma.aIGatewayRequest.create({
        data: {
          organizationId: req.organizationId,
          userId:         req.userId ?? null,
          feature:        req.feature,
          taskType:       req.task,
          modelId:        modelDbId,
          provider,
          inputTokens:    0,
          outputTokens:   0,
          totalTokens:    0,
          costUsd:        0,
          latencyMs:      0,
          cacheHit:       false,
          failoverUsed:   false,
          success:        false,
          errorCode,
          errorMessage:   errorMessage.slice(0, 1000),
        },
      });
    } catch { /* don't cascade */ }
  }

  // ── Usage reports ──────────────────────────────────────────────────────

  async getUsageReport(
    organizationId?: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<UsageReport> {
    const where: any = { success: true };
    if (organizationId) where.organizationId = organizationId;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate)   where.createdAt.lte = toDate;
    }

    const rows = await this.prisma.aIGatewayRequest.findMany({ where });

    const totalRequests   = rows.length;
    const totalTokens     = rows.reduce((s, r) => s + r.totalTokens, 0);
    const totalCostUsd    = rows.reduce((s, r) => s + r.costUsd, 0);
    const cacheHits       = rows.filter(r => r.cacheHit).length;
    const avgLatencyMs    = totalRequests ? rows.reduce((s, r) => s + r.latencyMs, 0) / totalRequests : 0;

    const byModel:    Record<string, any> = {};
    const byProvider: Record<string, any> = {};
    const byFeature:  Record<string, any> = {};
    const byTask:     Record<string, any> = {};
    const byDay:      Record<string, DailyUsage> = {};

    for (const r of rows) {
      const d = r.createdAt.toISOString().slice(0, 10);
      this.aggregate(byModel,    String(r.modelId),  r);
      this.aggregate(byProvider, String(r.provider), r);
      this.aggregate(byFeature,  r.feature,           r);
      this.aggregate(byTask,     r.taskType,           r);

      if (!byDay[d]) byDay[d] = { date: d, requests: 0, tokens: 0, costUsd: 0 };
      byDay[d].requests++;
      byDay[d].tokens  += r.totalTokens;
      byDay[d].costUsd += r.costUsd;
    }

    return {
      organizationId:    organizationId ?? 'global',
      periodStart:       fromDate ?? new Date(0),
      periodEnd:         toDate   ?? new Date(),
      totalRequests,
      totalTokens,
      totalCostUsd:      Math.round(totalCostUsd * 100000) / 100000,
      cacheHitRate:      totalRequests ? Math.round((cacheHits / totalRequests) * 1000) / 10 : 0,
      avgLatencyMs:      Math.round(avgLatencyMs),
      successRate:       100, // only success:true rows
      byModel,
      byProvider,
      byFeature,
      byTask,
      dailyBreakdown:    Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  async getSystemStats() {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayRows, monthRows, totalRows, cacheStats] = await Promise.all([
      this.prisma.aIGatewayRequest.findMany({ where: { createdAt: { gte: today }, success: true } }),
      this.prisma.aIGatewayRequest.findMany({ where: { createdAt: { gte: monthStart }, success: true } }),
      this.prisma.aIGatewayRequest.count(),
      this.prisma.aIGatewayRequest.aggregate({ _sum: { costUsd: true }, where: { cacheHit: true } }),
    ]);

    const topModelRow = await this.prisma.aIGatewayRequest.groupBy({
      by: ['modelId'],
      _count: { modelId: true },
      orderBy: { _count: { modelId: 'desc' } },
      take: 1,
      where: { success: true },
    });

    const topFeatureRow = await this.prisma.aIGatewayRequest.groupBy({
      by: ['feature'],
      _count: { feature: true },
      orderBy: { _count: { feature: 'desc' } },
      take: 1,
      where: { success: true },
    });

    return {
      todayRequests:    todayRows.length,
      todayCostUsd:     todayRows.reduce((s, r) => s + r.costUsd, 0),
      monthRequests:    monthRows.length,
      monthCostUsd:     monthRows.reduce((s, r) => s + r.costUsd, 0),
      totalRequests: totalRows,
      totalSavedUsd:    cacheStats._sum.costUsd ?? 0,
      topModelId:       topModelRow[0]?.modelId    ?? null,
      topFeature:       topFeatureRow[0]?.feature  ?? null,
    };
  }

  async getRecentRequests(params: {
    organizationId?: string;
    feature?: string;
    provider?: string;
    cacheHit?: boolean;
    success?: boolean;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (params.organizationId) where.organizationId = params.organizationId;
    if (params.feature)        where.feature        = params.feature;
    if (params.provider)       where.provider       = params.provider;
    if (params.cacheHit !== undefined) where.cacheHit = params.cacheHit;
    if (params.success  !== undefined) where.success  = params.success;
    if (params.fromDate || params.toDate) {
      where.createdAt = {};
      if (params.fromDate) where.createdAt.gte = params.fromDate;
      if (params.toDate)   where.createdAt.lte = params.toDate;
    }

    const [rows, total] = await Promise.all([
      this.prisma.aIGatewayRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take:   params.limit  ?? 50,
        skip:   params.offset ?? 0,
        include: { model: { select: { displayName: true, provider: true } } },
      }),
      this.prisma.aIGatewayRequest.count({ where }),
    ]);

    return { rows, total };
  }

  // ── Budget config CRUD ─────────────────────────────────────────────────

  async upsertBudget(data: {
    organizationId?: string | null;
    planTier?: string | null;
    dailyLimitUsd?: number | null;
    monthlyLimitUsd?: number | null;
    perRequestLimitUsd?: number | null;
    alertThresholdPct?: number;
    blockOnExceed?: boolean;
    notifyEmail?: string | null;
    isActive?: boolean;
  }) {
    const { organizationId = null, planTier = null, ...rest } = data;

    // Find existing record for this scope
    const existing = await this.prisma.aIBudgetConfig.findFirst({
      where: { organizationId, planTier },
    });

    if (existing) {
      return this.prisma.aIBudgetConfig.update({
        where: { id: existing.id },
        data:  { organizationId, planTier, ...rest },
      });
    }

    return this.prisma.aIBudgetConfig.create({
      data: { organizationId, planTier, ...rest },
    });
  }

  async getAllBudgets() {
    return this.prisma.aIBudgetConfig.findMany({ orderBy: { organizationId: 'asc' } });
  }

  // ── Private ────────────────────────────────────────────────────────────

  private async getSpend(organizationId: string): Promise<{ dailySpendUsd: number; monthlySpendUsd: number }> {
    const now        = new Date();
    const today      = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [daily, monthly] = await Promise.all([
      this.prisma.aIGatewayRequest.aggregate({
        _sum: { costUsd: true },
        where: { organizationId, createdAt: { gte: today }, success: true },
      }),
      this.prisma.aIGatewayRequest.aggregate({
        _sum: { costUsd: true },
        where: { organizationId, createdAt: { gte: monthStart }, success: true },
      }),
    ]);

    return {
      dailySpendUsd:   daily.  _sum.costUsd ?? 0,
      monthlySpendUsd: monthly._sum.costUsd ?? 0,
    };
  }

  private aggregate(acc: Record<string, any>, key: string, r: any): void {
    if (!acc[key]) acc[key] = { requests: 0, tokens: 0, costUsd: 0, cacheHits: 0 };
    acc[key].requests++;
    acc[key].tokens   += r.totalTokens;
    acc[key].costUsd  += r.costUsd;
    if (r.cacheHit) acc[key].cacheHits++;
  }
}
