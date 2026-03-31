import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateUGCProjectDto,
  UpdateUGCProjectDto,
  UpdateUGCScriptDto,
} from '../dto/ugc.dto';
import type { UGCBrandContext, UGCDashboardOverview } from '../ugc.types';

@Injectable()
export class UGCProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(organizationId: string): Promise<UGCDashboardOverview> {
    const [
      totalProjects,
      readyProjects,
      publishedProjects,
      avatarsAvailable,
      voiceClonesAvailable,
      rendersInFlight,
      recentProjects,
    ] = await Promise.all([
      this.prisma.uGCProject.count({ where: { organizationId } }),
      this.prisma.uGCProject.count({ where: { organizationId, status: 'READY' as any } }),
      this.prisma.uGCProject.count({ where: { organizationId, status: 'PUBLISHED' as any } }),
      this.prisma.uGCAvatar.count({
        where: {
          OR: [{ organizationId, isActive: true }, { organizationId: null, isSystem: true, isActive: true }],
        },
      }),
      this.prisma.voiceClone.count({ where: { organizationId, isActive: true } }),
      this.prisma.uGCRender.count({
        where: { project: { organizationId }, status: { in: ['QUEUED', 'PROCESSING'] as any } },
      }),
      this.prisma.uGCProject.findMany({
        where: { organizationId },
        take: 6,
        orderBy: { updatedAt: 'desc' },
        include: { avatar: { select: { name: true } } },
      }),
    ]);

    return {
      totalProjects,
      readyProjects,
      publishedProjects,
      avatarsAvailable,
      voiceClonesAvailable,
      rendersInFlight,
      recentProjects: recentProjects.map((project) => ({
        id: project.id,
        title: project.title,
        status: project.status as any,
        updatedAt: project.updatedAt,
        avatarName: project.avatar?.name ?? null,
        outputUrl: project.outputUrl ?? null,
      })),
    };
  }

  async listProjects(organizationId: string) {
    return this.prisma.uGCProject.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
      include: {
        avatar: { select: { id: true, name: true, style: true, thumbnailUrl: true } },
        voiceClone: { select: { id: true, name: true, provider: true } },
        script: { select: { id: true, estimatedSecs: true, version: true, updatedAt: true } },
        renders: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, videoUrl: true, createdAt: true, progress: true },
        },
      },
    });
  }

  async getProject(organizationId: string, projectId: string) {
    const project = await this.prisma.uGCProject.findFirst({
      where: { id: projectId, organizationId },
      include: {
        avatar: true,
        voiceClone: true,
        script: true,
        renders: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!project) throw new NotFoundException('UGC project not found');
    return project;
  }

  async createProject(organizationId: string, userId: string, dto: CreateUGCProjectDto) {
    if (dto.avatarId) await this.assertAvatarOwnership(organizationId, dto.avatarId);
    if (dto.voiceCloneId) await this.assertVoiceCloneOwnership(organizationId, dto.voiceCloneId);

    const brandContext = dto.brandContext ?? (await this.getBrandContextString(organizationId));

    return this.prisma.uGCProject.create({
      data: {
        organizationId,
        createdById: userId,
        title: dto.title,
        description: dto.description,
        avatarId: dto.avatarId,
        voiceCloneId: dto.voiceCloneId,
        brandContext,
        aspectRatio: dto.aspectRatio ?? '9:16',
        durationSeconds: dto.durationSeconds,
        platform: dto.platform,
      },
      include: {
        avatar: true,
        voiceClone: true,
        script: true,
        renders: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async updateProject(organizationId: string, projectId: string, dto: UpdateUGCProjectDto) {
    await this.assertProjectOwnership(organizationId, projectId);
    if (dto.avatarId) await this.assertAvatarOwnership(organizationId, dto.avatarId);
    if (dto.voiceCloneId) await this.assertVoiceCloneOwnership(organizationId, dto.voiceCloneId);

    return this.prisma.uGCProject.update({
      where: { id: projectId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.avatarId !== undefined && { avatarId: dto.avatarId || null }),
        ...(dto.voiceCloneId !== undefined && { voiceCloneId: dto.voiceCloneId || null }),
        ...(dto.brandContext !== undefined && { brandContext: dto.brandContext }),
        ...(dto.aspectRatio !== undefined && { aspectRatio: dto.aspectRatio }),
        ...(dto.durationSeconds !== undefined && { durationSeconds: dto.durationSeconds }),
        ...(dto.platform !== undefined && { platform: dto.platform }),
      },
      include: {
        avatar: true,
        voiceClone: true,
        script: true,
        renders: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async deleteProject(organizationId: string, projectId: string) {
    await this.assertProjectOwnership(organizationId, projectId);
    await this.prisma.uGCProject.delete({ where: { id: projectId } });
    return { success: true };
  }

  async publishProject(organizationId: string, projectId: string) {
    await this.assertProjectOwnership(organizationId, projectId);
    return this.prisma.uGCProject.update({
      where: { id: projectId },
      data: { status: 'PUBLISHED' as any, publishedAt: new Date() },
    });
  }

  async saveScript(organizationId: string, projectId: string, dto: UpdateUGCScriptDto) {
    await this.assertProjectOwnership(organizationId, projectId);

    const existing = await this.prisma.uGCScript.findUnique({ where: { projectId } });
    if (!existing) {
      return this.prisma.uGCScript.create({
        data: {
          projectId,
          content: dto.content,
          scenesJson: dto.scenesJson,
          aiGenerated: false,
          wordCount: this.countWords(dto.content),
          estimatedSecs: this.estimateDuration(dto.content),
        },
      });
    }

    return this.prisma.uGCScript.update({
      where: { projectId },
      data: {
        content: dto.content,
        scenesJson: dto.scenesJson,
        wordCount: this.countWords(dto.content),
        estimatedSecs: this.estimateDuration(dto.content),
        version: { increment: 1 },
      },
    });
  }

  async getProjectBrandContext(organizationId: string): Promise<UGCBrandContext> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { tenantOnboarding: true },
    });

    return {
      companyName: org?.tenantOnboarding?.companyName ?? org?.name,
      website: org?.tenantOnboarding?.companyWebsite ?? org?.website ?? undefined,
      description: org?.description ?? undefined,
      industry: org?.tenantOnboarding?.industry ?? undefined,
      logo: org?.tenantOnboarding?.companyLogo ?? org?.logo ?? undefined,
      defaultLanguage: org?.tenantOnboarding?.defaultLanguage ?? 'en',
      defaultTimezone: org?.tenantOnboarding?.defaultTimezone ?? 'UTC',
      featurePreferences: org?.tenantOnboarding?.featurePreferences ?? undefined,
      voiceNotes: [
        org?.description,
        org?.tenantOnboarding?.industry,
        org?.tenantOnboarding?.featurePreferences,
      ].filter(Boolean) as string[],
    };
  }

  async getBrandContextString(organizationId: string) {
    return JSON.stringify(await this.getProjectBrandContext(organizationId));
  }

  private async assertProjectOwnership(organizationId: string, projectId: string) {
    const project = await this.prisma.uGCProject.findFirst({ where: { id: projectId, organizationId } });
    if (!project) throw new NotFoundException('UGC project not found');
    return project;
  }

  private async assertAvatarOwnership(organizationId: string, avatarId: string) {
    const avatar = await this.prisma.uGCAvatar.findFirst({
      where: {
        id: avatarId,
        OR: [{ organizationId }, { organizationId: null, isSystem: true }],
      },
    });
    if (!avatar) throw new NotFoundException('Avatar not found');
  }

  private async assertVoiceCloneOwnership(organizationId: string, voiceCloneId: string) {
    const clone = await this.prisma.voiceClone.findFirst({ where: { id: voiceCloneId, organizationId } });
    if (!clone) throw new NotFoundException('Voice clone not found');
  }

  private countWords(content: string) {
    return content.trim().split(/\s+/).filter(Boolean).length;
  }

  private estimateDuration(content: string) {
    return Math.max(15, Math.round((this.countWords(content) / 150) * 60));
  }
}