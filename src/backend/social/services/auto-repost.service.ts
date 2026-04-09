/**
 * Auto Repost Service
 * Clones published posts for automatic reposting based on configured intervals.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PostStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
// import { SOCIAL_QUEUE } from '../processors/social-post.processor';
import { PublishJobPayload } from '../types/social.types';

const REPOST_CHECK_REPEAT_KEY = 'auto-repost-check';

@Injectable()
export class AutoRepostService implements OnModuleInit {
  private readonly logger = new Logger(AutoRepostService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('social-publishing') private readonly queue: Queue,
  ) {}

  async onModuleInit() {
    await this.setupRepeatable();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Clones a published post as a new ScheduledPost with parent reference.
   */
  async scheduleRepost(originalPostId: string): Promise<void> {
    const original = await this.prisma.scheduledPost.findUnique({
      where: { id: originalPostId },
      include: { accounts: { include: { account: true } } },
    });

    if (!original) {
      this.logger.warn(`Repost requested for non-existent post ${originalPostId}`);
      return;
    }

    if (!original.autoRepostEnabled) return;
    if (original.repostCount >= (original.maxReposts ?? 0)) {
      this.logger.log(`Post ${originalPostId} has reached max reposts`);
      return;
    }

    const intervalDays = original.repostIntervalDays ?? 7;
    const nextRepostAt = new Date(
      Date.now() + intervalDays * 24 * 60 * 60 * 1000,
    );

    // Create clone
    const repost = await this.prisma.scheduledPost.create({
      data: {
        organizationId: original.organizationId,
        createdById: original.createdById,
        content: original.content,
        mediaUrls: original.mediaUrls,
        mediaKeys: original.mediaKeys,
        link: original.link,
        hashtags: original.hashtags,
        scheduledAt: nextRepostAt,
        status: PostStatus.SCHEDULED,
        aiGenerated: original.aiGenerated,
        autoRepostEnabled: original.autoRepostEnabled,
        repostIntervalDays: original.repostIntervalDays,
        maxReposts: original.maxReposts,
        repostCount: 0,
        parentPostId: originalPostId,
        accounts: { create: original.accounts.map((a) => ({ accountId: a.accountId })) },
        publishResults: {
          create: original.accounts.map((acc) => ({
            accountId: acc.accountId,
            platform: acc.account.platform,
            status: 'PENDING' as const,
            attemptCount: 0,
          })),
        },
      },
      include: { accounts: true },
    });

    // Update original post's repost count and next repost time
    await this.prisma.scheduledPost.update({
      where: { id: originalPostId },
      data: {
        repostCount: { increment: 1 },
        nextRepostAt,
      },
    });

    // Queue publish job with delay
    const delay = Math.max(0, nextRepostAt.getTime() - Date.now());
    const payload: PublishJobPayload = {
      type: 'publish',
      postId: repost.id,
      organizationId: repost.organizationId,
      accountIds: repost.accounts.map((a) => a.accountId),
    };

    await this.queue.add(`publish:${repost.id}`, payload, {
      delay,
      attempts: 3,
      backoff: { type: 'exponential', delay: 30_000 },
      removeOnComplete: 50,
    });

    this.logger.log(
      `Scheduled repost ${repost.id} of ${originalPostId} at ${nextRepostAt.toISOString()}`,
    );
  }

  /**
   * Finds all posts due for reposting and queues repost jobs.
   * Called by the repeatable BullMQ job every 15 minutes.
   */
  async checkAndScheduleReposts(): Promise<void> {
    const now = new Date();

    const postsToRepost = await this.prisma.scheduledPost.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        autoRepostEnabled: true,
        nextRepostAt: { lte: now },
      },
      include: { accounts: true },
    });

    const eligible = postsToRepost.filter(
      (p) => p.maxReposts !== null && p.repostCount < p.maxReposts,
    );

    this.logger.log(
      `Auto-repost check: ${eligible.length} posts eligible for reposting`,
    );

    for (const post of eligible) {
      try {
        await this.scheduleRepost(post.id);
      } catch (err) {
        this.logger.error(
          `Failed to schedule repost for ${post.id}: ${(err as Error).message}`,
        );
      }
    }
  }

  /**
   * Sets up the repeatable BullMQ job that checks for due reposts every 15 minutes.
   */
  async setupRepeatable(): Promise<void> {
    // Remove any existing repeatable job to avoid duplicates
    const existing = await this.queue.getRepeatableJobs();
    const previous = existing.find((j) => j.key.includes(REPOST_CHECK_REPEAT_KEY));
    if (previous) {
      await this.queue.removeRepeatableByKey(previous.key);
    }

    await this.queue.add(
      REPOST_CHECK_REPEAT_KEY,
      { type: 'check-reposts', postId: '', organizationId: '', accountIds: [] } satisfies PublishJobPayload,
      {
        repeat: { every: 15 * 60 * 1000 }, // every 15 minutes
        removeOnComplete: 5,
        removeOnFail: 5,
      },
    );

    this.logger.log('Auto-repost repeatable job registered (every 15 minutes)');
  }
}
