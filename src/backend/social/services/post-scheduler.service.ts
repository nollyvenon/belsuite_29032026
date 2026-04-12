/**
 * Post Scheduler Service
 * Handles creation, updating, cancelling, and listing of scheduled social posts.
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PostStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { OptimalTimeService } from './optimal-time.service';
import { SOCIAL_QUEUE } from '../processors/social-post.processor';
import {
  CreatePostDto,
  UpdatePostDto,
  RescheduleDto,
  ListPostsQueryDto,
} from '../dto/social.dto';
import { PublishJobPayload, PostCalendarDay } from '../types/social.types';
import { SchedulingPolicyService } from './scheduling-policy.service';
import { SocialWebhookService } from './social-webhook.service';

const MUTABLE_STATUSES: PostStatus[] = [PostStatus.DRAFT, PostStatus.SCHEDULED];

@Injectable()
export class PostSchedulerService {
  private readonly logger = new Logger(PostSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(SOCIAL_QUEUE) private readonly queue: Queue,
    private readonly optimalTime: OptimalTimeService,
    private readonly schedulingPolicy: SchedulingPolicyService,
    private readonly webhookService: SocialWebhookService,
  ) {}

  // ── Create ────────────────────────────────────────────────────────────────

  async createPost(orgId: string, userId: string, dto: CreatePostDto) {
    // Validate accounts belong to org
    const accounts = await this.prisma.socialAccount.findMany({
      where: {
        id: { in: dto.accountIds },
        organizationId: orgId,
        isActive: true,
      },
    });

    if (accounts.length !== dto.accountIds.length) {
      throw new BadRequestException(
        'One or more account IDs are invalid or do not belong to this organisation.',
      );
    }

    // Resolve scheduled time
    let scheduledAt: Date | null = null;
    let optimalTimeUsed = false;

    if (dto.useOptimalTime && accounts.length > 0) {
      const platform = accounts[0].platform;
      const preview = await this.schedulingPolicy.previewSchedule(orgId, {
        platforms: [platform],
        count: 1,
      });
      const slot = preview.previews[0]?.slots[0];
      scheduledAt = slot ? new Date(slot.utcIso) : await this.optimalTime.getOptimalTime(orgId, platform);
      optimalTimeUsed = true;
    } else if (dto.scheduledAt) {
      scheduledAt = new Date(dto.scheduledAt);
      if (isNaN(scheduledAt.getTime())) {
        throw new BadRequestException('Invalid scheduledAt date');
      }
      await this.schedulingPolicy.validateScheduledAt(orgId, scheduledAt);
    }

    const status =
      scheduledAt && scheduledAt > new Date() ? PostStatus.SCHEDULED : PostStatus.DRAFT;

    const post = await this.prisma.scheduledPost.create({
      data: {
        organizationId: orgId,
        createdById: userId,
        content: dto.content,
        mediaUrls: dto.mediaUrls ?? [],
        link: dto.link ?? null,
        hashtags: dto.hashtags ?? [],
        scheduledAt,
        status,
        aiGenerated: false,
        optimalTimeUsed,
        autoRepostEnabled: dto.autoRepostEnabled ?? false,
        repostIntervalDays: dto.repostIntervalDays ?? null,
        maxReposts: dto.maxReposts ?? null,
        repostCount: 0,
        accounts: {
          create: dto.accountIds.map((accountId) => ({ accountId })),
        },
        publishResults: {
          create: accounts.map((acc) => ({
            accountId: acc.id,
            platform: acc.platform,
            status: 'PENDING' as const,
            attemptCount: 0,
          })),
        },
      },
      include: {
        accounts: true,
        publishResults: true,
      },
    });

    // Queue the job
    if (scheduledAt && scheduledAt > new Date()) {
      const delay = scheduledAt.getTime() - Date.now();
      await this.enqueuePublish(post, delay);
    } else if (status === PostStatus.SCHEDULED || !scheduledAt) {
      // Queue immediately for manual trigger
      await this.enqueuePublish(post, 0);
    }

    this.logger.log(`Created post ${post.id} for org ${orgId}`);

    await this.webhookService.emit(orgId, 'social.post.created', {
      postId: post.id,
      scheduledAt: post.scheduledAt?.toISOString() ?? null,
      status: post.status,
      optimalTimeUsed,
      accountIds: dto.accountIds,
      userId,
    });

    return post;
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  async listPosts(orgId: string, filters: ListPostsQueryDto) {
    if (!orgId) {
      throw new BadRequestException('Missing organization id');
    }

    const { status, platform, from, to, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { organizationId: orgId };

    if (status) where.status = status;

    if (platform) {
      where.accounts = { some: { account: { platform } } };
    }

    if (from || to) {
      where.scheduledAt = {};
      if (from) where.scheduledAt.gte = new Date(from);
      if (to) where.scheduledAt.lte = new Date(to);
    }

    const [posts, total] = await Promise.all([
      this.prisma.scheduledPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
        include: {
          accounts: {
            include: {
              account: {
                select: { id: true, platform: true, displayName: true, avatar: true },
              },
            },
          },
          publishResults: {
            select: {
              id: true,
              platform: true,
              status: true,
              platformUrl: true,
              errorMessage: true,
            },
          },
        },
      }),
      this.prisma.scheduledPost.count({ where }),
    ]);

    return {
      data: posts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPost(orgId: string, postId: string) {
    const post = await this.prisma.scheduledPost.findFirst({
      where: { id: postId, organizationId: orgId },
      include: {
        accounts: true,
        publishResults: true,
        parentPost: { select: { id: true, content: true } },
        reposts: { select: { id: true, status: true, createdAt: true } },
        bulkBatch: { select: { id: true, name: true } },
      },
    });

    if (!post) throw new NotFoundException(`Post ${postId} not found`);
    return post;
  }

  async getCalendar(
    orgId: string,
    from: Date,
    to: Date,
  ): Promise<PostCalendarDay[]> {
    const posts = await this.prisma.scheduledPost.findMany({
      where: {
        organizationId: orgId,
        scheduledAt: { gte: from, lte: to },
        status: { not: PostStatus.CANCELLED },
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        accounts: { include: { account: { select: { platform: true } } } },
      },
    });

    // Group by day
    const grouped = new Map<string, PostCalendarDay>();

    for (const post of posts) {
      if (!post.scheduledAt) continue;

      const day = post.scheduledAt.toISOString().slice(0, 10);

      if (!grouped.has(day)) {
        grouped.set(day, { date: day, posts: [] });
      }

      grouped.get(day)!.posts.push({
        id: post.id,
        content: post.content.substring(0, 100),
        scheduledAt: post.scheduledAt,
        status: post.status,
        platforms: post.accounts.map((a) => a.account.platform),
      });
    }

    return Array.from(grouped.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async updatePost(orgId: string, postId: string, dto: UpdatePostDto) {
    const post = await this.getPostOrThrow(orgId, postId);
    this.assertMutable(post);

    const updateData: any = {};

    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.mediaUrls !== undefined) updateData.mediaUrls = dto.mediaUrls;
    if (dto.link !== undefined) updateData.link = dto.link;
    if (dto.hashtags !== undefined) updateData.hashtags = dto.hashtags;
    if (dto.autoRepostEnabled !== undefined) updateData.autoRepostEnabled = dto.autoRepostEnabled;
    if (dto.repostIntervalDays !== undefined) updateData.repostIntervalDays = dto.repostIntervalDays;
    if (dto.maxReposts !== undefined) updateData.maxReposts = dto.maxReposts;

    if (dto.scheduledAt !== undefined) {
      updateData.scheduledAt = new Date(dto.scheduledAt);
      await this.schedulingPolicy.validateScheduledAt(orgId, updateData.scheduledAt);
      updateData.status =
        updateData.scheduledAt > new Date()
          ? PostStatus.SCHEDULED
          : PostStatus.DRAFT;
    }

    if (dto.accountIds !== undefined) {
      const accounts = await this.prisma.socialAccount.findMany({
        where: { id: { in: dto.accountIds }, organizationId: orgId },
      });

      if (accounts.length !== dto.accountIds.length) {
        throw new BadRequestException('One or more account IDs are invalid.');
      }

      // Explicit join table — replace by deleting old rows first
      await this.prisma.scheduledPostAccount.deleteMany({ where: { postId } });
      updateData.accounts = {
        create: dto.accountIds.map((accountId) => ({ accountId })),
      };
    }

    const updated = await this.prisma.scheduledPost.update({
      where: { id: postId },
      data: updateData,
      include: {
        accounts: { include: { account: true } },
        publishResults: true,
      },
    });

    // Re-queue if rescheduled
    if (dto.scheduledAt && updated.scheduledAt) {
      const delay = Math.max(0, updated.scheduledAt.getTime() - Date.now());
      await this.enqueuePublish(updated, delay);
    }

    await this.webhookService.emit(orgId, 'social.post.updated', {
      postId,
      scheduledAt: updated.scheduledAt?.toISOString() ?? null,
      status: updated.status,
    });

    return updated;
  }

  async reschedule(orgId: string, postId: string, dto: RescheduleDto) {
    const post = await this.getPostOrThrow(orgId, postId);
    this.assertMutable(post);

    const scheduledAt = new Date(dto.scheduledAt);
    if (isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Invalid scheduledAt date');
    }

    await this.schedulingPolicy.validateScheduledAt(orgId, scheduledAt);

    const updated = await this.prisma.scheduledPost.update({
      where: { id: postId },
      data: {
        scheduledAt,
        status:
          scheduledAt > new Date() ? PostStatus.SCHEDULED : PostStatus.DRAFT,
      },
      include: { accounts: true },
    });

    const delay = Math.max(0, scheduledAt.getTime() - Date.now());
    await this.enqueuePublish(updated, delay);

    this.logger.log(`Rescheduled post ${postId} to ${scheduledAt.toISOString()}`);

    await this.webhookService.emit(orgId, 'social.post.rescheduled', {
      postId,
      scheduledAt: scheduledAt.toISOString(),
      previousStatus: post.status,
    });

    return updated;
  }

  async cancelPost(orgId: string, postId: string) {
    const post = await this.getPostOrThrow(orgId, postId);

    if (post.status === PostStatus.PUBLISHED) {
      throw new ForbiddenException('Cannot cancel an already-published post.');
    }

    const cancelled = await this.prisma.scheduledPost.update({
      where: { id: postId },
      data: { status: PostStatus.CANCELLED },
    });

    await this.webhookService.emit(orgId, 'social.post.cancelled', {
      postId,
      previousStatus: post.status,
    });

    return cancelled;
  }

  async deletePost(orgId: string, postId: string) {
    const post = await this.getPostOrThrow(orgId, postId);
    this.assertMutable(post);

    await this.prisma.scheduledPost.update({
      where: { id: postId },
      data: { status: PostStatus.CANCELLED },
    });

    this.logger.log(`Soft-deleted (cancelled) post ${postId}`);
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private async getPostOrThrow(orgId: string, postId: string) {
    const post = await this.prisma.scheduledPost.findFirst({
      where: { id: postId, organizationId: orgId },
      include: { accounts: true },
    });

    if (!post) throw new NotFoundException(`Post ${postId} not found`);
    return post;
  }

  private assertMutable(post: { status: PostStatus }) {
    if (!MUTABLE_STATUSES.includes(post.status)) {
      throw new ForbiddenException(
        `Post cannot be modified in status: ${post.status}`,
      );
    }
  }

  private async enqueuePublish(
    post: { id: string; organizationId: string; accounts: Array<{ accountId: string }> },
    delay: number,
  ) {
    const payload: PublishJobPayload = {
      type: 'publish',
      postId: post.id,
      organizationId: post.organizationId,
      accountIds: post.accounts.map((a) => a.accountId),
    };

    await this.queue.add(`publish:${post.id}`, payload, {
      delay,
      attempts: 3,
      backoff: { type: 'exponential', delay: 30_000 },
      removeOnComplete: 50,
      removeOnFail: 20,
    });

    this.logger.log(
      `Queued publish job for post ${post.id} with delay=${delay}ms`,
    );
  }
}
