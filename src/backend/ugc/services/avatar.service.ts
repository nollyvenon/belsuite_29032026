import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUGCAvatarDto, UpdateUGCAvatarDto } from '../dto/ugc.dto';

@Injectable()
export class AvatarService {
  constructor(private readonly prisma: PrismaService) {}

  async listAvatars(organizationId: string) {
    return this.prisma.uGCAvatar.findMany({
      where: {
        OR: [
          { organizationId, isActive: true },
          { organizationId: null, isSystem: true, isActive: true },
        ],
      },
      orderBy: [{ isSystem: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAvatar(organizationId: string, dto: CreateUGCAvatarDto) {
    return this.prisma.uGCAvatar.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description,
        style: (dto.style ?? 'INFLUENCER') as any,
        provider: (dto.provider ?? 'MOCK') as any,
        externalId: dto.externalId,
        thumbnailUrl: dto.thumbnailUrl,
        previewVideoUrl: dto.previewVideoUrl,
        gender: (dto.gender ?? 'FEMALE') as any,
        ethnicityHint: dto.ethnicityHint,
        ageRange: dto.ageRange,
      },
    });
  }

  async updateAvatar(organizationId: string, avatarId: string, dto: UpdateUGCAvatarDto) {
    const avatar = await this.prisma.uGCAvatar.findFirst({ where: { id: avatarId, organizationId } });
    if (!avatar) throw new NotFoundException('Avatar not found');

    return this.prisma.uGCAvatar.update({
      where: { id: avatarId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.style !== undefined && { style: dto.style as any }),
        ...(dto.provider !== undefined && { provider: dto.provider as any }),
        ...(dto.thumbnailUrl !== undefined && { thumbnailUrl: dto.thumbnailUrl }),
        ...(dto.previewVideoUrl !== undefined && { previewVideoUrl: dto.previewVideoUrl }),
        ...(dto.gender !== undefined && { gender: dto.gender as any }),
        ...(dto.ethnicityHint !== undefined && { ethnicityHint: dto.ethnicityHint }),
        ...(dto.ageRange !== undefined && { ageRange: dto.ageRange }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }
}