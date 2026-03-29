/**
 * Rate Limiting Service
 * Enforces per-tenant rate limits for API, emails, and AI tokens
 */

import {
  Injectable,
  TooManyRequestsException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
  retryAfter?: number;
}

export interface UpdateRateLimitDto {
  apiRequestsPerMinute?: number;
  apiRequestsPerHour?: number;
  apiRequestsPerDay?: number;
  emailsPerMinute?: number;
  emailsPerHour?: number;
  emailsPerDay?: number;
  aiTokensPerMinute?: number;
  aiTokensPerHour?: number;
  aiTokensPerDay?: number;
  maxStorageGB?: number;
  maxConcurrentRequests?: number;
  maxConcurrentUploads?: number;
  enforceRateLimits?: boolean;
  softLimitNotifyAt?: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if API request allowed
   */
  async checkApiRequestLimit(
    organizationId: string,
    requestType: 'minute' | 'hour' | 'day' = 'minute',
  ): Promise<RateLimitCheckResult> {
    return this.checkLimit(organizationId, 'API', requestType);
  }

  /**
   * Check if email sending allowed
   */
  async checkEmailLimit(
    organizationId: string,
    requestType: 'minute' | 'hour' | 'day' = 'minute',
  ): Promise<RateLimitCheckResult> {
    return this.checkLimit(organizationId, 'EMAIL', requestType);
  }

  /**
   * Check if AI token usage allowed
   */
  async checkAiTokenLimit(
    organizationId: string,
    tokensRequested: number,
    requestType: 'minute' | 'hour' | 'day' = 'minute',
  ): Promise<RateLimitCheckResult> {
    return this.checkLimit(organizationId, 'AI_TOKENS', requestType, tokensRequested);
  }

  /**
   * Record API request
   */
  async recordApiRequest(organizationId: string): Promise<void> {
    await this.recordUsage(organizationId, 'API', 1);
  }

  /**
   * Record email sent
   */
  async recordEmail(organizationId: string): Promise<void> {
    await this.recordUsage(organizationId, 'EMAIL', 1);
  }

  /**
   * Record AI tokens used
   */
  async recordAiTokens(organizationId: string, tokens: number): Promise<void> {
    await this.recordUsage(organizationId, 'AI_TOKENS', tokens);
  }

  /**
   * Get current rate limit quotas for tenant
   */
  async getTenantQuotas(organizationId: string): Promise<any> {
    const quotas = await this.prisma.tenantRateLimitQuota.findUnique({
      where: { organizationId },
    });

    if (!quotas) {
      throw new BadRequestException(`No rate limit quotas found for tenant: ${organizationId}`);
    }

    return quotas;
  }

  /**
   * Update rate limit quotas
   */
  async updateQuotas(
    organizationId: string,
    dto: UpdateRateLimitDto,
  ): Promise<any> {
    const quotas = await this.prisma.tenantRateLimitQuota.update({
      where: { organizationId },
      data: dto,
    });

    this.logger.log(`Rate limits updated for tenant: ${organizationId}`);

    return quotas;
  }

  /**
   * Get current usage for tenant
   */
  async getCurrentUsage(
    organizationId: string,
    period: 'MINUTE' | 'HOUR' | 'DAY',
  ): Promise<any> {
    const now = new Date();
    const periodStart = this.getPeriodStart(now, period);

    const usage = await this.prisma.tenantRateLimitUsage.findFirst({
      where: {
        organizationId,
        period,
        periodStart,
      },
    });

    return usage || this.getEmptyUsage(organizationId, period, periodStart);
  }

  /**
   * Get usage history
   */
  async getUsageHistory(
    organizationId: string,
    period: 'MINUTE' | 'HOUR' | 'DAY',
    limit: number = 100,
  ): Promise<any[]> {
    const usage = await this.prisma.tenantRateLimitUsage.findMany({
      where: {
        organizationId,
        period,
      },
      orderBy: { periodStart: 'desc' },
      take: limit,
    });

    return usage;
  }

  /**
   * Generic rate limit check logic
   */
  private async checkLimit(
    organizationId: string,
    limitType: 'API' | 'EMAIL' | 'AI_TOKENS',
    requestType: 'minute' | 'hour' | 'day',
    amount: number = 1,
  ): Promise<RateLimitCheckResult> {
    try {
      const quotas = await this.getTenantQuotas(organizationId);

      // Get quota field for this type and request type
      const quotaField = this.getQuotaField(limitType, requestType);
      const limit = quotas[quotaField];

      // If not enforcing limits or unlimited
      if (!quotas.enforceRateLimits || !limit) {
        return {
          allowed: true,
          remaining: limit || Infinity,
          resetAt: this.getNextPeriodStart(new Date(), requestType),
          limit: limit || Infinity,
        };
      }

      // Get current usage
      const period = requestType.toUpperCase() as 'MINUTE' | 'HOUR' | 'DAY';
      const usage = await this.getCurrentUsage(organizationId, period);

      const usageField = this.getUsageField(limitType);
      const currentUsage = usage[usageField] || 0;
      const newUsage = currentUsage + amount;

      // Check if allowed
      const allowed = newUsage <= limit;
      const remaining = Math.max(0, limit - newUsage);
      const resetAt = this.getNextPeriodStart(new Date(), requestType);

      // Check for soft limit notification
      if (
        allowed &&
        quotas.softLimitNotifyAt &&
        newUsage >= (limit * quotas.softLimitNotifyAt) / 100
      ) {
        this.logger.warn(
          `Soft limit warning for ${organizationId}: ${newUsage}/${limit} ${limitType}`,
        );
        // TODO: Send notification to tenant
      }

      if (!allowed) {
        const retryAfter = Math.ceil((resetAt.getTime() - Date.now()) / 1000);
        this.logger.warn(
          `Rate limit exceeded for ${organizationId}: ${usageField} ${newUsage}/${limit}`,
        );

        throw new TooManyRequestsException({
          message: `Rate limit exceeded for ${limitType}`,
          retryAfter,
          remaining: 0,
        });
      }

      return {
        allowed: true,
        remaining,
        resetAt,
        limit,
      };
    } catch (error) {
      if (error instanceof TooManyRequestsException) {
        throw error;
      }
      this.logger.error(`Rate limit check failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Record usage for rate limiting
   */
  private async recordUsage(
    organizationId: string,
    limitType: 'API' | 'EMAIL' | 'AI_TOKENS',
    amount: number = 1,
  ): Promise<void> {
    // Record for each period type (minute, hour, day)
    const periods: Array<'MINUTE' | 'HOUR' | 'DAY'> = ['MINUTE', 'HOUR', 'DAY'];

    for (const period of periods) {
      const now = new Date();
      const periodStart = this.getPeriodStart(now, period.toLowerCase() as 'minute' | 'hour' | 'day');
      const periodEnd = this.getPeriodEnd(periodStart, period);

      const usageField = this.getUsageField(limitType);

      // Upsert usage record
      await this.prisma.tenantRateLimitUsage.upsert({
        where: {
          organizationId_period_periodStart: {
            organizationId,
            period,
            periodStart,
          },
        },
        update: {
          [usageField]: {
            increment: amount,
          },
        },
        create: {
          organizationId,
          period,
          periodStart,
          periodEnd,
          [usageField]: amount,
          apiRequestsUsed: 0,
          emailsUsed: 0,
          aiTokensUsed: 0,
          storageUsedGB: 0,
          concurrentRequests: 0,
          concurrentUploads: 0,
          limitExceededCount: 0,
        },
      });
    }
  }

  /**
   * Get quota field name for limit type and request type
   */
  private getQuotaField(limitType: string, requestType: string): string {
    const typeMap: Record<string, Record<string, string>> = {
      API: {
        minute: 'apiRequestsPerMinute',
        hour: 'apiRequestsPerHour',
        day: 'apiRequestsPerDay',
      },
      EMAIL: {
        minute: 'emailsPerMinute',
        hour: 'emailsPerHour',
        day: 'emailsPerDay',
      },
      AI_TOKENS: {
        minute: 'aiTokensPerMinute',
        hour: 'aiTokensPerHour',
        day: 'aiTokensPerDay',
      },
    };

    return typeMap[limitType][requestType];
  }

  /**
   * Get usage field name for limit type
   */
  private getUsageField(limitType: string): string {
    const fieldMap: Record<string, string> = {
      API: 'apiRequestsUsed',
      EMAIL: 'emailsUsed',
      AI_TOKENS: 'aiTokensUsed',
    };

    return fieldMap[limitType];
  }

  /**
   * Get period start date
   */
  private getPeriodStart(date: Date, period: 'minute' | 'hour' | 'day'): Date {
    const d = new Date(date);

    if (period === 'minute') {
      d.setSeconds(0, 0);
    } else if (period === 'hour') {
      d.setMinutes(0, 0, 0);
    } else if (period === 'day') {
      d.setHours(0, 0, 0, 0);
    }

    return d;
  }

  /**
   * Get period end date
   */
  private getPeriodEnd(start: Date, period: 'MINUTE' | 'HOUR' | 'DAY'): Date {
    const end = new Date(start);

    if (period === 'MINUTE') {
      end.setMinutes(end.getMinutes() + 1);
    } else if (period === 'HOUR') {
      end.setHours(end.getHours() + 1);
    } else if (period === 'DAY') {
      end.setDate(end.getDate() + 1);
    }

    return end;
  }

  /**
   * Get next period start
   */
  private getNextPeriodStart(date: Date, period: 'minute' | 'hour' | 'day'): Date {
    const next = new Date(date);

    if (period === 'minute') {
      next.setMinutes(next.getMinutes() + 1);
      next.setSeconds(0, 0);
    } else if (period === 'hour') {
      next.setHours(next.getHours() + 1);
      next.setMinutes(0, 0, 0);
    } else if (period === 'day') {
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
    }

    return next;
  }

  /**
   * Get empty usage record
   */
  private getEmptyUsage(
    organizationId: string,
    period: 'MINUTE' | 'HOUR' | 'DAY',
    periodStart: Date,
  ): any {
    return {
      organizationId,
      period,
      periodStart,
      periodEnd: this.getPeriodEnd(periodStart, period),
      apiRequestsUsed: 0,
      emailsUsed: 0,
      aiTokensUsed: 0,
      storageUsedGB: 0,
      concurrentRequests: 0,
      concurrentUploads: 0,
      limitExceededCount: 0,
      lastExceededAt: null,
    };
  }

  /**
   * Cleanup old usage records (runs daily)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldUsageRecords(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.tenantRateLimitUsage.deleteMany({
      where: {
        periodStart: {
          lt: thirtyDaysAgo,
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old usage records`);
  }
}
