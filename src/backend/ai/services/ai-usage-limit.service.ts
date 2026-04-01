import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SubscriptionTier } from '@prisma/client';
import { BillingService } from '../../payments/services/billing.service';

export interface UsageLimits {
  requestsPerMinute: number;
  tokensPerMonth: number;
  tier: SubscriptionTier;
  payAsYouGoEnabled: boolean;
  aiOveragePer1kTokens: number;
}

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage: {
    requestsThisMinute: number;
    tokensThisMonth: number;
  };
  limits: UsageLimits;
  remaining: {
    requestsThisMinute: number;
    tokensThisMonth: number;
  };
  billingMode: 'included' | 'payg';
}

@Injectable()
export class AIUsageLimitService {
  constructor(
    private prisma: PrismaService,
    private billingService: BillingService,
  ) {}

  /**
   * Get usage limits for the current billing plan
   */
  private async getLimitsForOrganization(organizationId: string): Promise<UsageLimits> {
    const entitlements = await this.billingService.getAiEntitlements(organizationId);

    return {
      requestsPerMinute: entitlements.requestsPerMinute,
      tokensPerMonth: entitlements.includedAiTokens,
      tier: entitlements.tier,
      payAsYouGoEnabled: entitlements.payAsYouGoEnabled,
      aiOveragePer1kTokens: entitlements.aiOveragePer1kTokens,
    };
  }

  /**
   * Check if user can make an AI request
   * Validates both per-minute request limit and monthly token limit
   */
  async checkUsageLimit(
    organizationId: string,
    userId: string,
    estimatedTokens: number = 100,
  ): Promise<UsageCheckResult> {
    const limits = await this.getLimitsForOrganization(organizationId);

    // Count requests in the last minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const requestsThisMinute = await this.prisma.aIUsage.count({
      where: {
        organizationId,
        userId,
        createdAt: {
          gte: oneMinuteAgo,
        },
      },
    });

    // Count tokens used this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const tokenUsageResult = await this.prisma.aIUsage.aggregate({
      where: {
        organizationId,
        userId,
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _sum: {
        totalTokens: true,
      },
    });

    const tokensThisMonth = tokenUsageResult._sum.totalTokens || 0;

    // Check limits
    const requestLimitExceeded = requestsThisMinute >= limits.requestsPerMinute;
    const exceedsIncludedTokens = tokensThisMonth + estimatedTokens > limits.tokensPerMonth;
    const tokenLimitExceeded = exceedsIncludedTokens && !limits.payAsYouGoEnabled;

    return {
      allowed: !requestLimitExceeded && !tokenLimitExceeded,
      reason: requestLimitExceeded
        ? `Request limit exceeded (${limits.requestsPerMinute} per minute)`
        : tokenLimitExceeded
          ? `Monthly token limit would be exceeded (${limits.tokensPerMonth} total)`
          : undefined,
      currentUsage: {
        requestsThisMinute,
        tokensThisMonth,
      },
      limits,
      remaining: {
        requestsThisMinute: Math.max(
          0,
          limits.requestsPerMinute - requestsThisMinute,
        ),
        tokensThisMonth: Math.max(
          0,
          limits.tokensPerMonth - tokensThisMonth,
        ),
      },
      billingMode: exceedsIncludedTokens ? 'payg' : 'included',
    };
  }

  /**
   * Check usage limit and throw if exceeded
   */
  async validateUsageLimit(
    organizationId: string,
    userId: string,
    estimatedTokens?: number,
  ): Promise<UsageCheckResult> {
    const result = await this.checkUsageLimit(
      organizationId,
      userId,
      estimatedTokens,
    );

    if (!result.allowed) {
      throw new ForbiddenException(result.reason);
    }

    return result;
  }

  /**
   * Get usage statistics for an organization
   */
  async getUsageStats(organizationId: string, userId?: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const where: any = { organizationId };
    if (userId) {
      where.userId = userId;
    }

    // This month's usage
    const thisMonthUsage = await this.prisma.aIUsage.aggregate({
      where: {
        ...where,
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _sum: {
        totalTokens: true,
        cost: true,
      },
      _count: true,
    });

    // Last 30 days usage breakdown
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const usageByModel = await this.prisma.aIUsage.groupBy({
      by: ['model'],
      where: {
        ...where,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _sum: {
        totalTokens: true,
        cost: true,
      },
      _count: true,
    });

    const usageByProvider = await this.prisma.aIUsage.groupBy({
      by: ['provider'],
      where: {
        ...where,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _sum: {
        totalTokens: true,
        cost: true,
      },
      _count: true,
    });

    return {
      thisMonth: {
        requests: thisMonthUsage._count,
        totalTokens: thisMonthUsage._sum.totalTokens || 0,
        totalCost: thisMonthUsage._sum.cost || 0,
      },
      byModel: usageByModel,
      byProvider: usageByProvider,
    };
  }

  /**
   * Get remaining usage for a user
   */
  async getRemaining(
    organizationId: string,
    userId: string,
  ): Promise<{
    requestsRemaining: number;
    tokensRemaining: number;
    tier: SubscriptionTier;
  }> {
    const result = await this.checkUsageLimit(organizationId, userId);
    return {
      requestsRemaining: result.remaining.requestsThisMinute,
      tokensRemaining:
        result.billingMode === 'payg'
          ? Number.MAX_SAFE_INTEGER
          : result.remaining.tokensThisMonth,
      tier: result.limits.tier,
    };
  }
}
