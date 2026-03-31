/**
 * Bulk Post Service
 * Creates multiple posts in a single batch operation.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BulkBatchStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PostSchedulerService } from './post-scheduler.service';
import { BulkCreateDto } from '../dto/social.dto';
import { BulkCreateResult } from '../types/social.types';

@Injectable()
export class BulkPostService {
  private readonly logger = new Logger(BulkPostService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scheduler: PostSchedulerService,
  ) {}

  // ── Public API ────────────────────────────────────────────────────────────

  async createBulk(
    orgId: string,
    userId: string,
    dto: BulkCreateDto,
  ): Promise<BulkCreateResult> {
    // Create the batch record first
    const batch = await this.prisma.bulkBatch.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        totalPosts: dto.posts.length,
        scheduledPosts: 0,
        publishedPosts: 0,
        failedPosts: 0,
        status: BulkBatchStatus.PROCESSING,
      },
    });

    let created = 0;
    let failed = 0;
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < dto.posts.length; i++) {
      try {
        const postDto = dto.posts[i];
        const post = await this.scheduler.createPost(orgId, userId, postDto);

        // Link post to batch
        await this.prisma.scheduledPost.update({
          where: { id: post.id },
          data: { bulkBatchId: batch.id },
        });

        created++;
      } catch (err) {
        failed++;
        errors.push({ index: i, error: (err as Error).message });
        this.logger.warn(
          `Bulk batch ${batch.id}: post[${i}] failed — ${(err as Error).message}`,
        );
      }
    }

    // Determine final batch status
    let finalStatus: BulkBatchStatus;

    if (failed === 0) {
      finalStatus = BulkBatchStatus.COMPLETED;
    } else if (created === 0) {
      finalStatus = BulkBatchStatus.FAILED;
    } else {
      finalStatus = BulkBatchStatus.PARTIAL;
    }

    await this.prisma.bulkBatch.update({
      where: { id: batch.id },
      data: {
        scheduledPosts: created,
        failedPosts: failed,
        status: finalStatus,
      },
    });

    this.logger.log(
      `Bulk batch ${batch.id}: ${created} created, ${failed} failed`,
    );

    return { batchId: batch.id, created, failed, errors };
  }

  async getBatch(orgId: string, batchId: string) {
    const batch = await this.prisma.bulkBatch.findFirst({
      where: { id: batchId, organizationId: orgId },
      include: {
        posts: {
          include: {
            accounts: {
              include: {
                account: {
                  select: { id: true, platform: true, displayName: true },
                },
              },
            },
            publishResults: {
              select: { platform: true, status: true, platformUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!batch) throw new NotFoundException(`Bulk batch ${batchId} not found`);
    return batch;
  }

  async listBatches(orgId: string) {
    return this.prisma.bulkBatch.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        _count: { select: { posts: true } },
      },
    });
  }
}
