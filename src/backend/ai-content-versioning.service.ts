// Version control for Content / ContentVersion (Prisma)

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';

@Injectable()
export class ContentVersioningService {
  constructor(private readonly prisma: PrismaService) {}

  async saveVersion(contentId: string, userId: string) {
    const content = await this.prisma.content.findUnique({ where: { id: contentId } });
    if (!content) {
      throw new NotFoundException(`Content ${contentId} not found`);
    }
    return this.prisma.contentVersion.create({
      data: {
        contentId: content.id,
        title: content.title,
        description: content.description,
        body: content.content,
        createdBy: userId,
      },
    });
  }

  async getVersions(contentId: string) {
    return this.prisma.contentVersion.findMany({
      where: { contentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async restoreVersion(versionId: string) {
    const version = await this.prisma.contentVersion.findUnique({
      where: { id: versionId },
    });
    if (!version) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }
    await this.prisma.content.update({
      where: { id: version.contentId },
      data: {
        title: version.title,
        description: version.description,
        content: version.body,
      },
    });
    return version;
  }
}
