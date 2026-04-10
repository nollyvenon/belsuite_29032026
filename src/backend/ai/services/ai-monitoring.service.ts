import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as crypto from 'crypto';

export interface AIMetrics {
  requestId: string;
  organizationId: string;
  userId: string;
  model: string;
  provider: string;
  contentType: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  cacheUsed: boolean;
  responseTime: number;
  success: boolean;
  errorMessage?: string;
  timestamp: Date;
}

export interface AIAlert {
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  organizationId: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

@Injectable()
export class AIMonitoringService {
  private readonly logger = new Logger(AIMonitoringService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Log AI generation metrics
   */
  async logMetrics(metrics: AIMetrics): Promise<void> {
    try {
      const duration = Date.now() - metrics.timestamp.getTime();

      this.logger.log(
        `[${metrics.model}] ${metrics.contentType} | ` +
          `Tokens: ${metrics.totalTokens} | ` +
          `Cost: $${metrics.cost.toFixed(4)} | ` +
          `Time: ${duration}ms | ` +
          `Cache: ${metrics.cacheUsed ? 'HIT' : 'MISS'}`,
      );

      // Alert on expensive operations
      if (metrics.cost > 1.0) {
        this.logAlert({
          level: 'warning',
          title: 'Expensive Generation',
          message: `Generation cost $${metrics.cost.toFixed(4)} using ${metrics.model}`,
          organizationId: metrics.organizationId,
          userId: metrics.userId,
          metadata: {
            model: metrics.model,
            tokens: metrics.totalTokens,
            cost: metrics.cost,
          },
          timestamp: new Date(),
        });
      }

      // Alert on slow operations
      if (metrics.responseTime > 30000) {
        this.logAlert({
          level: 'warning',
          title: 'Slow Generation',
          message: `Generation took ${(metrics.responseTime / 1000).toFixed(2)}s`,
          organizationId: metrics.organizationId,
          userId: metrics.userId,
          metadata: {
            responseTime: metrics.responseTime,
            model: metrics.model,
          },
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.logger.error(`Failed to log metrics: ${error.message}`);
    }
  }

  /**
   * Log alert or notification
   */
  async logAlert(alert: AIAlert): Promise<void> {
    try {
      this.logger.warn(
        `[${alert.level.toUpperCase()}] ${alert.title}: ${alert.message}`,
      );

      // Store in database for admin dashboard
      // This could be expanded with a dedicated Alerts table

      // Send to monitoring service (Sentry, DataDog, etc.)
      if (alert.level === 'critical' || alert.level === 'error') {
        this.sendToMonitoringService(alert);
      }
    } catch (error) {
      this.logger.error(`Failed to log alert: ${error.message}`);
    }
  }

  /**
   * Check for cost anomalies
   */
  async checkCostAnomalies(organizationId: string): Promise<void> {
    try {
      const now = new Date();
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Get usage from last 24 hours
      const usage24h = await this.prisma.aIUsage.aggregate({
        where: {
          organizationId,
          createdAt: { gte: dayAgo },
        },
        _sum: { cost: true },
      });

      const cost24h = usage24h._sum.cost || 0;

      // Get average daily cost from last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const usage30d = await this.prisma.aIUsage.aggregate({
        where: {
          organizationId,
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { cost: true },
      });

      const avgDaily = (usage30d._sum.cost || 0) / 30;

      // Alert if today's usage is 3x above average
      if (cost24h > avgDaily * 3) {
        this.logAlert({
          level: 'warning',
          title: 'Unusual AI Spending',
          message: `Today's spending ($${cost24h.toFixed(2)}) is 3x above average ($${avgDaily.toFixed(2)}/day)`,
          organizationId,
          metadata: {
            cost24h,
            avgDaily,
            ratio: (cost24h / avgDaily).toFixed(1),
          },
          timestamp: now,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to check cost anomalies: ${error.message}`);
    }
  }

  /**
   * Monitor provider health and availability
   */
  async monitorProviderHealth(): Promise<Map<string, boolean>> {
    const health = new Map<string, boolean>();

    try {
      // Check OpenAI
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        });
        health.set('openai', response.ok);
      } catch (error) {
        health.set('openai', false);
      }

      // Check Anthropic
      try {
        const headers: Record<string, string> = {};
        if (process.env.ANTHROPIC_API_KEY) {
          headers['x-api-key'] = process.env.ANTHROPIC_API_KEY;
        }

        const response = await fetch('https://api.anthropic.com/v1/models', {
          headers,
        });
        health.set('anthropic', response.ok);
      } catch (error) {
        health.set('anthropic', false);
      }

      // Check Ollama
      try {
        const response = await fetch(
          `${process.env.OLLAMA_BASE_URL}/api/tags`,
        );
        health.set('ollama', response.ok);
      } catch (error) {
        health.set('ollama', false);
      }

      // Log alerts for down providers
      health.forEach((status, provider) => {
        if (!status) {
          this.logAlert({
            level: 'error',
            title: 'Provider Health Check Failed',
            message: `${provider} provider is not responding`,
            organizationId: 'system',
            metadata: { provider },
            timestamp: new Date(),
          });
        }
      });

      return health;
    } catch (error) {
      this.logger.error(`Failed to monitor provider health: ${error.message}`);
      return health;
    }
  }

  /**
   * Generate usage report
   */
  async generateUsageReport(organizationId: string, days: number = 30) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const usageData = await this.prisma.aIUsage.findMany({
        where: {
          organizationId,
          createdAt: { gte: startDate },
        },
        select: {
          createdAt: true,
          model: true,
          provider: true,
          totalTokens: true,
          cost: true,
          contentType: true,
          success: true,
        },
      });

      // Aggregate by date
      const byDate = new Map<string, any>();
      usageData.forEach((record) => {
        const date = record.createdAt.toISOString().split('T')[0];
        if (!byDate.has(date)) {
          byDate.set(date, {
            requests: 0,
            tokens: 0,
            cost: 0,
            byModel: {},
            byContentType: {},
          });
        }

        const dayData = byDate.get(date);
        dayData.requests++;
        dayData.tokens += record.totalTokens;
        dayData.cost += record.cost;

        // Track by model
        if (!dayData.byModel[record.model]) {
          dayData.byModel[record.model] = {
            requests: 0,
            cost: 0,
          };
        }
        dayData.byModel[record.model].requests++;
        dayData.byModel[record.model].cost += record.cost;

        // Track by content type
        const contentType = record.contentType ?? 'unknown';
        if (!dayData.byContentType[contentType]) {
          dayData.byContentType[contentType] = {
            requests: 0,
            cost: 0,
          };
        }
        dayData.byContentType[contentType].requests++;
        dayData.byContentType[contentType].cost += record.cost;
      });

      return {
        organizationId,
        period: { days, startDate, endDate: new Date() },
        summary: {
          totalRequests: usageData.length,
          totalTokens: usageData.reduce((sum, r) => sum + r.totalTokens, 0),
          totalCost: usageData.reduce((sum, r) => sum + r.cost, 0),
          successRate:
            (usageData.filter((r) => r.success).length / usageData.length) *
            100,
        },
        byDate: Object.fromEntries(byDate),
      };
    } catch (error) {
      this.logger.error(`Failed to generate usage report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Estimate costs for the month
   */
  async estimateMonthlySpending(
    organizationId: string,
  ): Promise<{ estimated: number; projected: number }> {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const daysIntoMonth = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

      const thisMonthUsage = await this.prisma.aIUsage.aggregate({
        where: {
          organizationId,
          createdAt: { gte: monthStart },
        },
        _sum: { cost: true },
      });

      const costSoFar = thisMonthUsage._sum.cost || 0;
      const dailyAverage = costSoFar / daysIntoMonth;
      const projected = dailyAverage * daysInMonth;

      return {
        estimated: costSoFar,
        projected: Math.ceil(projected * 100) / 100,
      };
    } catch (error) {
      this.logger.error(`Failed to estimate spending: ${error.message}`);
      return { estimated: 0, projected: 0 };
    }
  }

  /**
   * Send alert to external monitoring service
   */
  private sendToMonitoringService(alert: AIAlert): void {
    try {
      const sentryDsn = process.env.SENTRY_DSN;
      if (!sentryDsn) return;

      // Would integrate with Sentry or similar service
      // No-op when external monitoring sink is not configured
      this.logger.debug(
        `Sending alert to monitoring service: ${alert.title}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send alert to monitoring service: ${error.message}`,
      );
    }
  }

  /**
   * Generate request ID with hash
   */
  generateRequestId(): string {
    return crypto.randomUUID();
  }

  /**
   * Create hash of request for deduplication
   */
  hashRequest(prompt: string, model: string): string {
    return crypto
      .createHash('sha256')
      .update(`${prompt}:${model}`)
      .digest('hex');
  }
}
