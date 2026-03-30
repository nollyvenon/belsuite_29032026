import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { SubscriptionTier } from '@prisma/client';

export interface UsageLimits {
  requestsPerMinute: number;
  tokensPerMonth: number;
  tier: SubscriptionTier;
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
}

@Injectable()
export class AIUsageLimitService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Get usage limits for a subscription tier
   */
  private getLimitsForTier(tier: SubscriptionTier): UsageLimits {
    const tierLimits: Record<SubscriptionTier, UsageLimits> = {
      FREE: {
        requestsPerMinute: this.configService.get<number>(
          'AI_REQUESTS_PER_MINUTE_FREE',
          10,
        ),
        tokensPerMonth: this.configService.get<number>(
          'AI_TOKENS_PER_MONTH_FREE',
          100000,
        ),
        tier: 'FREE',
      },
      STARTER: {
        requestsPerMinute: this.configService.get<number>(
          'AI_REQUESTS_PER_MINUTE_STARTER',
          50,
        ),
        tokensPerMonth: this.configService.get<number>(
          'AI_TOKENS_PER_MONTH_STARTER',
          1000000,
        ),
        tier: 'STARTER',
      },
      PROFESSIONAL: {
        requestsPerMinute: this.configService.get<number>(
          'AI_REQUESTS_PER_MINUTE_PROFESSIONAL',
          200,
        ),
        tokensPerMonth: this.configService.get<number>(
          'AI_TOKENS_PER_MONTH_PROFESSIONAL',
          10000000,
        ),
        tier: 'PROFESSIONAL',
      },
      ENTERPRISE: {
        requestsPerMinute: this.configService.get<number>(
          'AI_REQUESTS_PER_MINUTE_ENTERPRISE',
          1000,
        ),
        tokensPerMonth: this.configService.get<number>(
          'AI_TOKENS_PER_MONTH_ENTERPRISE',
          100000000,
        ),
        tier: 'ENTERPRISE',
      },
    };

    return tierLimits[tier];
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
    // Get organization with tier info
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { tier: true },
    });

    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    const tier = organization.tier;
    const limits = this.getLimitsForTier(tier);

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
    const tokenLimitExceeded =
      tokensThisMonth + estimatedTokens > limits.tokensPerMonth;

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
      tokensRemaining: result.remaining.tokensThisMonth,
      tier: result.limits.tier,
    };
  }
}
