import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto';
import { PaginationUtil } from '../common/utils/pagination.util';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create new content
   */
  async createContent(
    organizationId: string,
    userId: string,
    createDto: CreateContentDto,
  ) {
    const content = await this.prisma.content.create({
      data: {
        organizationId,
        creatorId: userId,
        title: createDto.title,
        description: createDto.description,
        type: createDto.type,
        content: createDto.content,
        thumbnail: createDto.thumbnail,
        slug: this.generateSlug(createDto.title),
        status: 'DRAFT',
      },
    });

    return content;
  }

  /**
   * Get content by ID
   */
  async getContent(contentId: string, organizationId: string) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        media: true,
      },
    });

    if (!content || content.organizationId !== organizationId) {
      throw new NotFoundException('Content not found');
    }

    return content;
  }

  /**
   * List organization content
   */
  async listContent(
    organizationId: string,
    userId: string,
    page: number = 1,
    limit: number = 10,
    filter?: { status?: string; type?: string },
  ) {
    const { skip, take } = PaginationUtil.getPaginationParams(page, limit);

    const whereClause: any = { organizationId };
    if (filter?.status) whereClause.status = filter.status;
    if (filter?.type) whereClause.type = filter.type;

    const [content, total] = await Promise.all([
      this.prisma.content.findMany({
        where: whereClause,
        skip,
        take,
        include: {
          creator: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.content.count({ where: whereClause }),
    ]);

    return PaginationUtil.buildPaginatedResponse(content, total, page, limit);
  }

  /**
   * Update content
   */
  async updateContent(
    contentId: string,
    organizationId: string,
    userId: string,
    updateDto: UpdateContentDto,
  ) {
    const content = await this.getContent(contentId, organizationId);

    // Verify ownership
    if (content.creatorId !== userId) {
      throw new ForbiddenException('Cannot modify content');
    }

    const updated = await this.prisma.content.update({
      where: { id: contentId },
      data: updateDto,
    });

    return updated;
  }

  /**
   * Delete content
   */
  async deleteContent(
    contentId: string,
    organizationId: string,
    userId: string,
  ) {
    const content = await this.getContent(contentId, organizationId);

    if (content.creatorId !== userId) {
      throw new ForbiddenException('Cannot delete content');
    }

    await this.prisma.content.delete({
      where: { id: contentId },
    });

    return { success: true };
  }

  /**
   * Publish content
   */
  async publishContent(
    contentId: string,
    organizationId: string,
    userId: string,
  ) {
    const content = await this.getContent(contentId, organizationId);

    if (content.creatorId !== userId) {
      throw new ForbiddenException('Cannot publish content');
    }

    const published = await this.prisma.content.update({
      where: { id: contentId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    return published;
  }

  /**
   * Schedule content
   */
  async scheduleContent(
    contentId: string,
    organizationId: string,
    userId: string,
    scheduledAt: Date,
  ) {
    const content = await this.getContent(contentId, organizationId);

    if (content.creatorId !== userId) {
      throw new ForbiddenException('Cannot schedule content');
    }

    const scheduled = await this.prisma.content.update({
      where: { id: contentId },
      data: {
        status: 'SCHEDULED',
        scheduledAt,
      },
    });

    return scheduled;
  }

  /**
   * Generate slug from title
   */
  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return base;
  }
}
