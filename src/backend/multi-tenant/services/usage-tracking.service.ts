/**
 * Usage Tracking Service
 * Tracks per-tenant consumption metrics for billing and usage reports
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface UsageMetrics {
  month: string;
  aiTokensUsed: number;
  aiRequestsCount: number;
  storageUsedBytes: number;
  apiCallsCount: number;
  emailsSent: number;
  emailsDelivered: number;
  emailsBounced: number;
  emailsOpened: number;
  emailsClicked: number;
  contentCount: number;
  activeUsers: number;
  estimatedCost: number;
}

export interface UsageAlert {
  type: 'WARNING' | 'CRITICAL' | 'EXCEEDED';
  metric: string;
  current: number;
  limit: number;
  percentageOfLimit: number;
  message: string;
}

@Injectable()
export class UsageTrackingService {
  private readonly logger = new Logger(UsageTrackingService.name);

  // Pricing per unit
  private readonly pricing = {
    aiTokens: 0.0001, // $0.0001 per 1000 tokens
    apiCalls: 0.001, // $0.001 per 1000 calls
    storageGB: 0.1, // $0.10 per GB per month
    emailSent: 0.001, // $0.001 per email
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record AI token usage
   */
  async recordAiTokens(organizationId: string, tokens: number): Promise<void> {
    await this.recordMetric(organizationId, 'aiTokensUsed', tokens);
  }

  /**
   * Record AI request
   */
  async recordAiRequest(organizationId: string): Promise<void> {
    await this.recordMetric(organizationId, 'aiRequestsCount', 1);
  }

  /**
   * Record API call
   */
  async recordApiCall(organizationId: string): Promise<void> {
    await this.recordMetric(organizationId, 'apiCallsCount', 1);
  }

  /**
   * Record email sent
   */
  async recordEmailSent(organizationId: string): Promise<void> {
    await this.recordMetric(organizationId, 'emailsSent', 1);
  }

  /**
   * Record email event
   */
  async recordEmailEvent(
    organizationId: string,
    eventType: 'DELIVERED' | 'BOUNCED' | 'OPENED' | 'CLICKED',
  ): Promise<void> {
    const fieldMap = {
      DELIVERED: 'emailsDelivered',
      BOUNCED: 'emailsBounced',
      OPENED: 'emailsOpened',
      CLICKED: 'emailsClicked',
    };

    await this.recordMetric(organizationId, fieldMap[eventType], 1);
  }

  /**
   * Record storage usage
   */
  async recordStorageUsage(organizationId: string, bytes: number): Promise<void> {
    // Convert to GB and record
    const gb = bytes / (1024 * 1024 * 1024);
    await this.recordMetric(organizationId, 'storageUsedBytes', bytes);
  }

  /**
   * Record content creation
   */
  async recordContentCreated(organizationId: string): Promise<void> {
    await this.recordMetric(organizationId, 'contentCount', 1);
  }

  /**
   * Record active user
   */
  async recordActiveUser(organizationId: string): Promise<void> {
    // This is more complex - would need to dedup users
    // For now just record
    await this.recordMetric(organizationId, 'activeUsers', 1);
  }

  /**
   * Get usage for current month
   */
  async getCurrentMonthUsage(organizationId: string): Promise<UsageMetrics> {
    const month = this.getCurrentMonth();
    return this.getMonthUsage(organizationId, month);
  }

  /**
   * Get usage for specific month
   */
  async getMonthUsage(organizationId: string, month: string): Promise<UsageMetrics> {
    const usage = await this.prisma.tenantUsage.findUnique({
      where: {
        organizationId_period: {
          organizationId,
          period: month,
        },
      },
    });

    if (!usage) {
      return this.getEmptyUsage(month);
    }

    // Calculate estimated cost
    const estimatedCost = this.calculateCost(usage);

    return {
      month: usage.period,
      aiTokensUsed: usage.aiTokensUsed || 0,
      aiRequestsCount: usage.aiRequestsCount || 0,
      storageUsedBytes: Number(usage.storageUsedBytes || 0),
      apiCallsCount: usage.apiCallsCount || 0,
      emailsSent: usage.emailsSent || 0,
      emailsDelivered: usage.emailsDelivered || 0,
      emailsBounced: usage.emailsBounced || 0,
      emailsOpened: usage.emailsOpened || 0,
      emailsClicked: usage.emailsClicked || 0,
      contentCount: usage.contentCount || 0,
      activeUsers: usage.activeUsers || 0,
      estimatedCost,
    };
  }

  /**
   * Get usage history
   */
  async getUsageHistory(
    organizationId: string,
    months: number = 12,
  ): Promise<UsageMetrics[]> {
    const startMonth = this.getMonthsAgo(months);

    const usage = await this.prisma.tenantUsage.findMany({
      where: {
        organizationId,
        period: {
          gte: startMonth,
        },
      },
      orderBy: { period: 'desc' },
      take: months,
    });

    return usage.map(u => ({
      month: u.period,
      aiTokensUsed: u.aiTokensUsed || 0,
      aiRequestsCount: u.aiRequestsCount || 0,
      storageUsedBytes: Number(u.storageUsedBytes || 0),
      apiCallsCount: u.apiCallsCount || 0,
      emailsSent: u.emailsSent || 0,
      emailsDelivered: u.emailsDelivered || 0,
      emailsBounced: u.emailsBounced || 0,
      emailsOpened: u.emailsOpened || 0,
      emailsClicked: u.emailsClicked || 0,
      contentCount: u.contentCount || 0,
      activeUsers: u.activeUsers || 0,
      estimatedCost: this.calculateCost(u),
    }));
  }

  /**
   * Get usage alerts for tenant
   */
  async getUsageAlerts(organizationId: string): Promise<UsageAlert[]> {
    const usage = await this.getCurrentMonthUsage(organizationId);
    const quotas = await this.prisma.tenantRateLimitQuota.findUnique({
      where: { organizationId },
    });

    if (!quotas) {
      return [];
    }

    const alerts: UsageAlert[] = [];

    // Check storage
    const storageGB = usage.storageUsedBytes / (1024 * 1024 * 1024);
    const storagePercentage = (storageGB / quotas.maxStorageGB) * 100;

    if (storagePercentage >= 100) {
      alerts.push({
        type: 'EXCEEDED',
        metric: 'Storage',
        current: storageGB,
        limit: quotas.maxStorageGB,
        percentageOfLimit: storagePercentage,
        message: `Storage limit exceeded: ${storageGB.toFixed(2)}GB / ${quotas.maxStorageGB}GB`,
      });
    } else if (storagePercentage >= 90) {
      alerts.push({
        type: 'CRITICAL',
        metric: 'Storage',
        current: storageGB,
        limit: quotas.maxStorageGB,
        percentageOfLimit: storagePercentage,
        message: `Storage usage critical: ${storageGB.toFixed(2)}GB / ${quotas.maxStorageGB}GB (90%)`,
      });
    } else if (storagePercentage >= 75) {
      alerts.push({
        type: 'WARNING',
        metric: 'Storage',
        current: storageGB,
        limit: quotas.maxStorageGB,
        percentageOfLimit: storagePercentage,
        message: `Approaching storage limit: ${storageGB.toFixed(2)}GB / ${quotas.maxStorageGB}GB (75%)`,
      });
    }

    // Check AI tokens
    if (quotas.aiTokensPerDay) {
      const aiTokenPercentage = (usage.aiTokensUsed / quotas.aiTokensPerDay) * 100;

      if (aiTokenPercentage >= 100) {
        alerts.push({
          type: 'EXCEEDED',
          metric: 'AI Tokens',
          current: usage.aiTokensUsed,
          limit: quotas.aiTokensPerDay,
          percentageOfLimit: aiTokenPercentage,
          message: `Daily AI token limit exceeded`,
        });
      } else if (aiTokenPercentage >= 90) {
        alerts.push({
          type: 'CRITICAL',
          metric: 'AI Tokens',
          current: usage.aiTokensUsed,
          limit: quotas.aiTokensPerDay,
          percentageOfLimit: aiTokenPercentage,
          message: `Daily AI token usage critical (90%)`,
        });
      }
    }

    return alerts;
  }

  /**
   * Export usage report
   */
  async exportUsageReport(organizationId: string, format: 'csv' | 'json' = 'json'): Promise<any> {
    const history = await this.getUsageHistory(organizationId, 12);

    if (format === 'csv') {
      return this.convertToCsv(history);
    }

    return history;
  }

  /**
   * Get usage summary by plan
   */
  async getUsageSummary(organizationId: string): Promise<any> {
    const current = await this.getCurrentMonthUsage(organizationId);
    const history = await this.getUsageHistory(organizationId, 12);

    const avgMonthlyUsage = {
      aiTokens: Math.round(
        history.reduce((sum, m) => sum + m.aiTokensUsed, 0) / history.length,
      ),
      apiCalls: Math.round(
        history.reduce((sum, m) => sum + m.apiCallsCount, 0) / history.length,
      ),
      emails: Math.round(
        history.reduce((sum, m) => sum + m.emailsSent, 0) / history.length,
      ),
      storageGB: Math.round(
        (history.reduce((sum, m) => sum + m.storageUsedBytes, 0) / history.length) /
          (1024 * 1024 * 1024),
      ),
    };

    const monthlyTrend =
      history.length > 1
        ? (
            (history[0].estimatedCost - history[1].estimatedCost) /
            history[1].estimatedCost
          ) * 100
        : 0;

    return {
      current,
      avgMonthlyUsage,
      monthlyTrend: `${monthlyTrend.toFixed(1)}%`,
      thirtyDayEstimatedCost: history
        .slice(0, Math.min(30, history.length))
        .reduce((sum, m) => sum + m.estimatedCost, 0),
    };
  }

  /**
   * Record a generic metric
   */
  private async recordMetric(
    organizationId: string,
    field: string,
    increment: number,
  ): Promise<void> {
    try {
      const month = this.getCurrentMonth();

      await this.prisma.tenantUsage.upsert({
        where: {
          organizationId_period: {
            organizationId,
            period: month,
          },
        },
        update: {
          [field]: {
            increment,
          },
        },
        create: {
          organizationId,
          period: month,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          [field]: increment,
          aiTokensUsed: 0,
          aiRequestsCount: 0,
          storageUsedBytes: 0,
          apiCallsCount: 0,
          emailsSent: 0,
          emailsDelivered: 0,
          emailsBounced: 0,
          emailsOpened: 0,
          emailsClicked: 0,
          contentCount: 0,
          activeUsers: 0,
          estimatedCost: 0,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to record metric: ${error.message}`, error.stack);
      // Don't throw - usage tracking shouldn't break the app
    }
  }

  /**
   * Calculate estimated cost
   */
  private calculateCost(usage: any): number {
    let cost = 0;

    cost += (usage.aiTokensUsed || 0) * (this.pricing.aiTokens / 1000);
    cost += (usage.apiCallsCount || 0) * (this.pricing.apiCalls / 1000);
    cost += ((usage.storageUsedBytes || 0) / (1024 * 1024 * 1024)) * this.pricing.storageGB;
    cost += (usage.emailsSent || 0) * this.pricing.emailSent;

    return Math.round(cost * 100) / 100; // Round to 2 decimals
  }

  /**
   * Get current month in YYYY-MM format
   */
  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Get month N months ago
   */
  private getMonthsAgo(months: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Get empty usage object
   */
  private getEmptyUsage(month: string): UsageMetrics {
    return {
      month,
      aiTokensUsed: 0,
      aiRequestsCount: 0,
      storageUsedBytes: 0,
      apiCallsCount: 0,
      emailsSent: 0,
      emailsDelivered: 0,
      emailsBounced: 0,
      emailsOpened: 0,
      emailsClicked: 0,
      contentCount: 0,
      activeUsers: 0,
      estimatedCost: 0,
    };
  }

  /**
   * Convert to CSV
   */
  private convertToCsv(data: UsageMetrics[]): string {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).join(',')).join('\n');
    return `${headers}\n${rows}`;
  }

  /**
   * Cleanup old records (runs monthly)
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async cleanupOldRecords(): Promise<void> {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const result = await this.prisma.tenantUsage.deleteMany({
      where: {
        startDate: {
          lt: twoYearsAgo,
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old usage records`);
  }
}
