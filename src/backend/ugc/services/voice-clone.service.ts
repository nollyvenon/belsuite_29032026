import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateVoiceCloneDto, UpdateVoiceCloneDto } from '../dto/ugc.dto';
import { VoiceProviderService } from './voice-provider.service';

@Injectable()
export class VoiceCloneService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly voiceProvider: VoiceProviderService,
  ) {}

  async listVoiceClones(organizationId: string) {
    return this.prisma.voiceClone.findMany({
      where: { organizationId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createVoiceClone(organizationId: string, dto: CreateVoiceCloneDto) {
    const provisioned = await this.voiceProvider.provisionVoiceClone(dto);

    return this.prisma.voiceClone.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description,
        provider: provisioned.provider,
        externalVoiceId: provisioned.externalVoiceId ?? dto.externalVoiceId,
        sampleAudioUrl: dto.sampleAudioUrl,
        gender: (dto.gender ?? 'FEMALE') as any,
        language: dto.language ?? 'en',
        accent: dto.accent,
        stability: dto.stability ?? 0.5,
        similarityBoost: dto.similarityBoost ?? 0.75,
        styleExaggeration: dto.styleExaggeration ?? 0,
      },
    });
  }

  async updateVoiceClone(organizationId: string, voiceCloneId: string, dto: UpdateVoiceCloneDto) {
    const clone = await this.prisma.voiceClone.findFirst({ where: { id: voiceCloneId, organizationId } });
    if (!clone) throw new NotFoundException('Voice clone not found');

    const updated = await this.prisma.voiceClone.update({
      where: { id: voiceCloneId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.sampleAudioUrl !== undefined && { sampleAudioUrl: dto.sampleAudioUrl }),
        ...(dto.gender !== undefined && { gender: dto.gender as any }),
        ...(dto.language !== undefined && { language: dto.language }),
        ...(dto.accent !== undefined && { accent: dto.accent }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.stability !== undefined && { stability: dto.stability }),
        ...(dto.similarityBoost !== undefined && { similarityBoost: dto.similarityBoost }),
        ...(dto.styleExaggeration !== undefined && { styleExaggeration: dto.styleExaggeration }),
      },
    });

    if (dto.isDefault) {
      await this.prisma.voiceClone.updateMany({
        where: { organizationId, id: { not: voiceCloneId } },
        data: { isDefault: false },
      });
      return this.prisma.voiceClone.update({
        where: { id: voiceCloneId },
        data: { isDefault: true },
      });
    }

    return updated;
  }
}