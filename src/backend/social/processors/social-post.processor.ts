/**
 * Social Post Processor (BullMQ Worker)
 * Handles publish, retry, and repost jobs from the social-publishing queue.
 */

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { PostStatus, PublishStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { SocialAccountService } from '../services/social-account.service';
import { AutoRepostService } from '../services/auto-repost.service';
import { SocialWebhookService } from '../services/social-webhook.service';
import { PublishJobPayload } from '../types/social.types';

export const SOCIAL_QUEUE = 'social-publishing';

/** Retry delays in ascending order (ms) */
const RETRY_DELAYS_MS = [
  5 * 60 * 1000,      // 5 min
  15 * 60 * 1000,     // 15 min
  60 * 60 * 1000,     // 1 hr
  3 * 60 * 60 * 1000, // 3 hrs (ceiling)
];

@Processor(SOCIAL_QUEUE, { concurrency: 5 })
export class SocialPostProcessor extends WorkerHost {
  private readonly logger = new Logger(SocialPostProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accountService: SocialAccountService,
    private readonly autoRepost: AutoRepostService,
    private readonly webhookService: SocialWebhookService,
    @InjectQueue(SOCIAL_QUEUE) private readonly queue: Queue,
  ) {
    super();
  }

  async process(job: Job<PublishJobPayload>): Promise<void> {
    this.logger.log(
      `Processing job ${job.id} type=${job.data.type} post=${job.data.postId}`,
    );

    switch (job.data.type) {
      case 'publish':
        await this.handlePublish(job);
        break;
      case 'retry':
        await this.handleRetry(job);
        break;
      case 'repost':
        await this.handleRepost(job);
        break;
      case 'check-reposts':
        await this.autoRepost.checkAndScheduleReposts();
        break;
      default:
        throw new Error(`Unknown job type: ${(job.data as any).type}`);
    }
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  private async handlePublish(job: Job<PublishJobPayload>): Promise<void> {
    const { postId, organizationId } = job.data;

    const post = await this.prisma.scheduledPost.findFirst({
      where: { id: postId, organizationId },
      include: {
        accounts: { include: { account: true } },
        publishResults: true,
      },
    });

    if (!post) {
      this.logger.warn(`Post ${postId} not found, skipping`);
      return;
    }

    if (
      post.status === PostStatus.CANCELLED ||
      post.status === PostStatus.PUBLISHED
    ) {
      this.logger.log(`Post ${postId} is ${post.status}, skipping`);
      return;
    }

    // Mark as publishing
    await this.prisma.scheduledPost.update({
      where: { id: postId },
      data: { status: PostStatus.PUBLISHING },
    });

    let successCount = 0;
    let failCount = 0;

    for (const result of post.publishResults) {
      const join = post.accounts.find((a) => a.accountId === result.accountId);
      const account = join?.account;
      if (!account) continue;

      try {
        // Refresh expired token before publishing
        if (account.tokenExpiresAt && account.tokenExpiresAt <= new Date()) {
          this.logger.log(`Refreshing expired token for account ${account.id}`);
          await this.accountService.refreshAccountToken(account.id);
        }

        const decryptedAccount = await this.accountService.getDecryptedAccount(
          account.id,
        );
        const publisher = this.accountService.getPublisher(account.platform);
        const publishResult = await publisher.publish(decryptedAccount, post);

        if (publishResult.error) {
          throw new Error(publishResult.error);
        }

        await this.prisma.postPublishResult.update({
          where: { id: result.id },
          data: {
            status: PublishStatus.SUCCESS,
            platformPostId: publishResult.platformPostId ?? null,
            platformUrl: publishResult.platformUrl ?? null,
            publishedAt: new Date(),
            attemptCount: { increment: 1 },
          },
        });

        successCount++;
        this.logger.log(
          `Published post ${postId} → ${account.platform}: ${publishResult.platformPostId}`,
        );
      } catch (err) {
        const errMsg = (err as Error).message;
        failCount++;

        const newAttemptCount = result.attemptCount + 1;
        const retryDelayIdx = Math.min(
          newAttemptCount - 1,
          RETRY_DELAYS_MS.length - 1,
        );
        const retryDelay = RETRY_DELAYS_MS[retryDelayIdx];
        const nextRetryAt = new Date(Date.now() + retryDelay);

        await this.prisma.postPublishResult.update({
          where: { id: result.id },
          data: {
            status: PublishStatus.FAILED,
            errorMessage: errMsg,
            attemptCount: { increment: 1 },
            nextRetryAt,
          },
        });

        this.logger.error(
          `Failed to publish post ${postId} → ${account.platform}: ${errMsg}`,
        );

        // Schedule retry
        await this.enqueueRetry(result.id, postId, organizationId, retryDelay);
      }
    }

    // Determine final post status
    const finalStatus =
      successCount > 0 ? PostStatus.PUBLISHED : PostStatus.FAILED;

    await this.prisma.scheduledPost.update({
      where: { id: postId },
      data: {
        status: finalStatus,
        publishedAt: finalStatus === PostStatus.PUBLISHED ? new Date() : null,
      },
    });

    await this.webhookService.emit(organizationId, `social.post.${finalStatus.toLowerCase()}`, {
      postId,
      successCount,
      failCount,
      publishedAt: finalStatus === PostStatus.PUBLISHED ? new Date().toISOString() : null,
    });

    // Schedule first repost if enabled and at least partially published
    if (finalStatus === PostStatus.PUBLISHED && post.autoRepostEnabled) {
      const repostDelay =
        (post.repostIntervalDays ?? 7) * 24 * 60 * 60 * 1000;

      await this.queue.add(
        `repost:${postId}`,
        {
          type: 'repost',
          postId,
          organizationId,
          accountIds: post.accounts.map((a) => a.accountId),
        } satisfies PublishJobPayload,
        { delay: repostDelay, removeOnComplete: 20 },
      );

      this.logger.log(
        `Scheduled first repost for ${postId} in ${post.repostIntervalDays ?? 7} days`,
      );
    }
  }

  // ── Retry ─────────────────────────────────────────────────────────────────

  private async handleRetry(job: Job<PublishJobPayload>): Promise<void> {
    const { resultId, postId, organizationId } = job.data;
    if (!resultId) return;

    const result = await this.prisma.postPublishResult.findUnique({
      where: { id: resultId },
      include: { account: true, post: true },
    });

    if (!result) {
      this.logger.warn(`PostPublishResult ${resultId} not found, skipping`);
      return;
    }

    if (result.status === PublishStatus.SUCCESS) {
      this.logger.log(`Result ${resultId} already succeeded`);
      return;
    }

    await this.prisma.postPublishResult.update({
      where: { id: resultId },
      data: { status: PublishStatus.RETRYING },
    });

    try {
      if (
        result.account.tokenExpiresAt &&
        result.account.tokenExpiresAt <= new Date()
      ) {
        await this.accountService.refreshAccountToken(result.account.id);
      }

      const decryptedAccount = await this.accountService.getDecryptedAccount(
        result.account.id,
      );
      const publisher = this.accountService.getPublisher(
        result.account.platform,
      );
      const publishResult = await publisher.publish(decryptedAccount, result.post);

      if (publishResult.error) throw new Error(publishResult.error);

      await this.prisma.postPublishResult.update({
        where: { id: resultId },
        data: {
          status: PublishStatus.SUCCESS,
          platformPostId: publishResult.platformPostId ?? null,
          platformUrl: publishResult.platformUrl ?? null,
          publishedAt: new Date(),
          attemptCount: { increment: 1 },
          nextRetryAt: null,
        },
      });

      // Promote post status if all results now succeeded
      const allResults = await this.prisma.postPublishResult.findMany({
        where: { postId },
      });
      const allSuccess = allResults.every(
        (r) => r.status === PublishStatus.SUCCESS,
      );

      if (allSuccess) {
        await this.prisma.scheduledPost.update({
          where: { id: postId },
          data: { status: PostStatus.PUBLISHED, publishedAt: new Date() },
        });

        await this.webhookService.emit(organizationId, 'social.post.published', {
          postId,
          resultId,
          retry: true,
        });
      }

      this.logger.log(`Retry succeeded for result ${resultId}`);
    } catch (err) {
      const errMsg = (err as Error).message;
      const newCount = result.attemptCount + 1;
      const retryDelayIdx = Math.min(newCount - 1, RETRY_DELAYS_MS.length - 1);
      const retryDelay = RETRY_DELAYS_MS[retryDelayIdx];

      await this.prisma.postPublishResult.update({
        where: { id: resultId },
        data: {
          status: PublishStatus.FAILED,
          errorMessage: errMsg,
          attemptCount: { increment: 1 },
          nextRetryAt: new Date(Date.now() + retryDelay),
        },
      });

      this.logger.error(`Retry failed for result ${resultId}: ${errMsg}`);

      // Only schedule further retries if not at ceiling
      if (newCount < RETRY_DELAYS_MS.length) {
        await this.enqueueRetry(resultId, postId, organizationId, retryDelay);
      }
    }
  }

  // ── Repost ────────────────────────────────────────────────────────────────

  private async handleRepost(job: Job<PublishJobPayload>): Promise<void> {
    await this.autoRepost.scheduleRepost(job.data.postId);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async enqueueRetry(
    resultId: string,
    postId: string,
    organizationId: string,
    delay: number,
  ): Promise<void> {
    const payload: PublishJobPayload = {
      type: 'retry',
      postId,
      organizationId,
      accountIds: [],
      resultId,
    };

    await this.queue.add(`retry:${resultId}`, payload, {
      delay,
      attempts: 1,
      removeOnComplete: 10,
      removeOnFail: 10,
    });

    this.logger.log(
      `Queued retry for result ${resultId} in ${delay / 1000}s`,
    );
  }
}
