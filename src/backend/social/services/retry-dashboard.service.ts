/**
 * Retry Dashboard Service
 *
 * Surfaces failed publish results for the org and allows manual re-queuing.
 * Works alongside the automatic retry logic in SocialPostProcessor.
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PublishStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { SOCIAL_QUEUE } from '../processors/social-post.processor';
import { PublishJobPayload } from '../types/social.types';

@Injectable()
export class RetryDashboardService {
  private readonly logger = new Logger(RetryDashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(SOCIAL_QUEUE) private readonly queue: Queue,
  ) {}

  // ── List failed results ───────────────────────────────────────────────────

  /**
   * Returns the 50 most recent failed PostPublishResults for the org,
   * enriched with post captions and account platform names.
   */
  async listFailed(
    orgId: string,
    sortBy: 'createdAt' | 'attemptCount' | 'platform' | 'nextRetryAt' = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    const orderByMap: Record<string, any> = {
      createdAt: { createdAt: sortOrder },
      attemptCount: { attemptCount: sortOrder },
      platform: { account: { platform: sortOrder } },
      nextRetryAt: [{ nextRetryAt: { sort: sortOrder, nulls: 'last' as const } }],
    };

    const results = await this.prisma.postPublishResult.findMany({
      where: {
        post: { organizationId: orgId },
        status: PublishStatus.FAILED,
        dismissedAt: null,
      },
      orderBy: orderByMap[sortBy],
      take: 50,
      include: {
        post: {
          select: {
            id: true,
            content: true,
            mediaUrls: true,
            scheduledAt: true,
            status: true,
          },
        },
        account: {
          select: {
            id: true,
            platform: true,
            platformUsername: true,
          },
        },
      },
    });

    return results.map((r) => ({
      id: r.id,
      errorMessage: r.errorMessage,
      attemptCount: r.attemptCount,
      lastAttemptAt: r.createdAt,
      nextRetryAt: r.nextRetryAt,
      post: r.post,
      account: r.account,
    }));
  }

  // ── Manual retry ──────────────────────────────────────────────────────────

  /**
   * Re-queues a single failed PostPublishResult immediately.
   * Verifies org ownership before enqueuing.
   */
  async manualRetry(orgId: string, resultId: string): Promise<void> {
    const result = await this.prisma.postPublishResult.findUnique({
      where: { id: resultId },
      include: {
        post: { select: { organizationId: true } },
      },
    });

    if (!result) throw new NotFoundException('Publish result not found');
    if (result.post.organizationId !== orgId) {
      throw new ForbiddenException('Not your publish result');
    }
    if (result.status !== PublishStatus.FAILED) {
      // Already succeeded or pending — nothing to do
      return;
    }

    await this.prisma.postPublishResult.update({
      where: { id: resultId },
      data: { status: PublishStatus.PENDING, errorMessage: null },
    });

    const payload: PublishJobPayload = {
      type: 'retry',
      postId: result.postId,
      organizationId: orgId,
      accountIds: [result.accountId],
      resultId: result.id,
    };

    await this.queue.add('publish', payload, {
      jobId: `manual-retry-${result.id}-${Date.now()}`,
    });

    this.logger.log(`Manual retry enqueued for result ${resultId} by org ${orgId}`);
  }

  // ── Dismiss ───────────────────────────────────────────────────────────────

  /**
   * Marks a failed result as acknowledged so it no longer appears in the
   * failed list. Does NOT delete the record for audit purposes.
   */
  async dismiss(orgId: string, resultId: string): Promise<void> {
    const result = await this.prisma.postPublishResult.findUnique({
      where: { id: resultId },
      include: { post: { select: { organizationId: true } } },
    });

    if (!result) throw new NotFoundException('Publish result not found');
    if (result.post.organizationId !== orgId) {
      throw new ForbiddenException('Not your publish result');
    }

    await this.prisma.postPublishResult.update({
      where: { id: resultId },
      data: { dismissedAt: new Date() },
    });
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  /**
   * Returns publish success/failure counts broken down by platform
   * for the last 30 days.
   */
  async getStats(orgId: string) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [total, succeeded, failed, pending, byPlatform] = await Promise.all([
      this.prisma.postPublishResult.count({
        where: { post: { organizationId: orgId }, createdAt: { gte: since } },
      }),
      this.prisma.postPublishResult.count({
        where: {
          post: { organizationId: orgId },
          status: PublishStatus.SUCCESS,
          createdAt: { gte: since },
        },
      }),
      this.prisma.postPublishResult.count({
        where: {
          post: { organizationId: orgId },
          status: PublishStatus.FAILED,
          createdAt: { gte: since },
          dismissedAt: null,
        },
      }),
      this.prisma.postPublishResult.count({
        where: {
          post: { organizationId: orgId },
          status: PublishStatus.PENDING,
          createdAt: { gte: since },
        },
      }),
      // Group by platform via account join
      this.prisma.$queryRaw<Array<{ platform: string; status: string; count: bigint }>>`
        SELECT sa.platform, ppr.status, COUNT(*) as count
        FROM "PostPublishResult" ppr
        JOIN "ScheduledPost" sp ON ppr."postId" = sp.id
        JOIN "SocialAccount" sa ON ppr."accountId" = sa.id
        WHERE sp."organizationId" = ${orgId}
          AND ppr."createdAt" >= ${since}
        GROUP BY sa.platform, ppr.status
        ORDER BY sa.platform, ppr.status
      `,
    ]);

    const platformBreakdown: Record<string, { success: number; failed: number; pending: number }> =
      {};

    for (const row of byPlatform) {
      if (!platformBreakdown[row.platform]) {
        platformBreakdown[row.platform] = { success: 0, failed: 0, pending: 0 };
      }
      const n = Number(row.count);
      if (row.status === 'SUCCESS') platformBreakdown[row.platform].success += n;
      else if (row.status === 'FAILED') platformBreakdown[row.platform].failed += n;
      else if (row.status === 'PENDING') platformBreakdown[row.platform].pending += n;
    }

    return {
      period: '30d',
      total,
      succeeded,
      failed,
      pending,
      successRate: total > 0 ? Math.round((succeeded / total) * 100) : null,
      platforms: platformBreakdown,
    };
  }
}
