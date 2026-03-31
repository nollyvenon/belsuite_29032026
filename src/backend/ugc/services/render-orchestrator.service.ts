import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUGCRenderDto } from '../dto/ugc.dto';
import { UGCProjectService } from './ugc-project.service';
import { RenderProviderService } from './render-provider.service';

@Injectable()
export class RenderOrchestratorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: UGCProjectService,
    private readonly renderProvider: RenderProviderService,
  ) {}

  async listRenders(organizationId: string, projectId: string) {
    await this.projects.getProject(organizationId, projectId);
    return this.prisma.uGCRender.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async renderProject(organizationId: string, projectId: string, dto: CreateUGCRenderDto) {
    const project = await this.projects.getProject(organizationId, projectId);
    if (!project.script?.content) {
      throw new BadRequestException('Generate or save a script before rendering');
    }

    const settings = {
      faceAnimation: dto.faceAnimation ?? true,
      lipSyncIntensity: dto.lipSyncIntensity ?? 0.82,
      resolution: dto.resolution ?? '1080p',
      enableCaptions: dto.enableCaptions ?? true,
      backgroundMusic: dto.backgroundMusic ?? false,
      aspectRatio: dto.aspectRatio ?? project.aspectRatio ?? '9:16',
      avatarProvider: project.avatar?.provider ?? 'MOCK',
      voiceProvider: project.voiceClone?.provider ?? 'elevenlabs',
    };

    await this.prisma.uGCProject.update({
      where: { id: projectId },
      data: { status: 'RENDERING' as any },
    });

    const execution = await this.renderProvider.renderProject(
      {
        organizationId,
        projectId,
        title: project.title,
        durationSeconds: project.durationSeconds,
        avatar: project.avatar,
        voiceClone: project.voiceClone,
        script: project.script,
      },
      settings,
    );

    const render = await this.prisma.uGCRender.create({
      data: {
        projectId,
        status: execution.status as any,
        provider: execution.provider,
        externalJobId: execution.externalJobId,
        progress: execution.progress,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt ?? undefined,
        videoUrl: execution.videoUrl ?? undefined,
        thumbnailUrl: execution.thumbnailUrl ?? undefined,
        durationSeconds: execution.videoUrl
          ? project.durationSeconds ?? project.script.estimatedSecs ?? 30
          : undefined,
        settingsJson: JSON.stringify(settings),
      },
    });

    await this.prisma.uGCProject.update({
      where: { id: projectId },
      data: {
        status: execution.status === 'COMPLETE' ? ('READY' as any) : ('RENDERING' as any),
        outputUrl: execution.videoUrl ?? undefined,
        thumbnailUrl: execution.thumbnailUrl ?? undefined,
      },
    });

    return render;
  }
}