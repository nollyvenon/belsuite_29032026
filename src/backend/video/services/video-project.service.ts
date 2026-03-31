/**
 * Video Project Service
 * Orchestrates project CRUD, scene generation, render job dispatch, and timeline management.
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { SceneGeneratorService } from './scene-generator.service';
import { VIDEO_QUEUE } from '../processors/video.processor';
import {
  CreateProjectDto,
  GenerateFromScriptDto,
  RenderProjectDto,
  UpdateTimelineDto,
  GenerateSubtitlesDto,
  UpdateSceneDto,
} from '../dto/video.dto';
import { VideoJobType, VideoJobStatus, VideoStatus } from '@prisma/client';
import { TimelineState } from '../types/video.types';
@Injectable()
export class VideoProjectService {
  private readonly logger = new Logger(VideoProjectService.name);

  constructor(
    private readonly prisma:    PrismaService,
    private readonly generator: SceneGeneratorService,
    @InjectQueue(VIDEO_QUEUE)
    private readonly queue:     Queue,
  ) {}

  // ── Project CRUD ──────────────────────────────────────────────────────────

  async createProject(
    dto: CreateProjectDto,
    userId: string,
    organizationId: string,
  ) {
    const [width, height] = this.resolveResolution(dto.aspectRatio ?? '16:9');

    const project = await this.prisma.videoProject.create({
      data: {
        organizationId,
        createdById: userId,
        title:       dto.title,
        description: dto.description,
        script:      dto.script,
        status:      VideoStatus.DRAFT,
        width,
        height,
      },
    });

    this.logger.log(`Project created: ${project.id}`);
    return project;
  }

  async listProjects(organizationId: string, _userId: string) {
    return this.prisma.videoProject.findMany({
      where:   { organizationId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { scenes: true, processingJobs: true } } },
    });
  }

  async getProject(projectId: string, organizationId: string) {
    const project = await this.prisma.videoProject.findFirst({
      where:   { id: projectId, organizationId },
      include: {
        scenes:         { orderBy: { order: 'asc' } },
        subtitleTracks: true,
        processingJobs: { orderBy: { createdAt: 'desc' }, take: 10 },
        mediaAssets:    { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    return project;
  }

  async updateProject(
    projectId: string,
    organizationId: string,
    patch: Partial<{ title: string; description: string; script: string }>,
  ) {
    await this.assertOwnership(projectId, organizationId);
    return this.prisma.videoProject.update({ where: { id: projectId }, data: patch });
  }

  async deleteProject(projectId: string, organizationId: string): Promise<void> {
    await this.assertOwnership(projectId, organizationId);
    await this.prisma.videoProject.update({
      where: { id: projectId },
      data:  { status: VideoStatus.ARCHIVED },
    });
    this.logger.log(`Project archived: ${projectId}`);
  }

  // ── Scene generation ──────────────────────────────────────────────────────

  async generateFromScript(
    projectId: string,
    organizationId: string,
    dto: GenerateFromScriptDto,
  ): Promise<TimelineState> {
    await this.assertOwnership(projectId, organizationId);

    await this.prisma.videoProject.update({
      where: { id: projectId },
      data:  { status: VideoStatus.PROCESSING, script: dto.script },
    });

    try {
      const timeline = await this.generator.generateFromScript({
        projectId,
        organizationId,
        script:      dto.script,
        voiceId:     dto.voiceId,
        style:       dto.style,
        aspectRatio: dto.aspectRatio,
        language:    dto.language,
      });

      await this.prisma.videoProject.update({
        where: { id: projectId },
        data:  { status: VideoStatus.DRAFT },
      });

      return timeline;
    } catch (err: unknown) {
      await this.prisma.videoProject.update({
        where: { id: projectId },
        data:  { status: VideoStatus.FAILED },
      });
      throw err;
    }
  }

  // ── Timeline management ───────────────────────────────────────────────────

  async saveTimeline(
    projectId: string,
    organizationId: string,
    dto: UpdateTimelineDto,
  ) {
    await this.assertOwnership(projectId, organizationId);

    let parsed: TimelineState;
    try {
      parsed = JSON.parse(dto.timelineJson);
    } catch {
      throw new BadRequestException('Invalid timelineJson: not valid JSON');
    }

    return this.prisma.videoProject.update({
      where: { id: projectId },
      data:  { timelineJson: dto.timelineJson, durationMs: parsed.durationMs },
    });
  }

  async getTimeline(projectId: string, organizationId: string): Promise<TimelineState | null> {
    const project = await this.getProject(projectId, organizationId);
    if (!project.timelineJson) return null;
    return JSON.parse(project.timelineJson) as TimelineState;
  }

  // ── Scene management ──────────────────────────────────────────────────────

  async updateScene(
    sceneId: string,
    projectId: string,
    organizationId: string,
    dto: UpdateSceneDto,
  ) {
    await this.assertOwnership(projectId, organizationId);
    return this.prisma.videoScene.update({
      where: { id: sceneId },
      data:  dto,
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  async queueRender(
    projectId: string,
    organizationId: string,
    dto: RenderProjectDto,
  ) {
    await this.assertOwnership(projectId, organizationId);

    const format  = dto.format  ?? 'mp4';
    const quality = dto.quality ?? 'medium';

    // Create DB job record
    const dbJob = await this.prisma.videoJob.create({
      data: {
        videoProjectId: projectId,
        jobType:        VideoJobType.RENDER,
        status:         VideoJobStatus.QUEUED,
        inputJson:      JSON.stringify({ format, quality }),
      },
    });

    // Add to BullMQ queue
    const bullJob = await this.queue.add(
      'render',
      { type: 'render', projectId, organizationId, outputFormat: format, quality },
      { attempts: 2, backoff: { type: 'exponential', delay: 5000 } },
    );

    // Store bullJob ID for tracking
    await this.prisma.videoJob.update({
      where: { id: dbJob.id },
      data:  { bullJobId: String(bullJob.id) },
    });

    await this.prisma.videoProject.update({
      where: { id: projectId },
      data:  { status: VideoStatus.PROCESSING },
    });

    this.logger.log(`Render queued: project=${projectId} bullJob=${bullJob.id}`);
    return { jobId: dbJob.id, bullJobId: bullJob.id };
  }

  async getRenderStatus(projectId: string, organizationId: string) {
    await this.assertOwnership(projectId, organizationId);
    return this.prisma.videoJob.findMany({
      where:   { videoProjectId: projectId, jobType: VideoJobType.RENDER },
      orderBy: { createdAt: 'desc' },
      take:    5,
    });
  }

  // ── Subtitles ─────────────────────────────────────────────────────────────

  async generateSubtitles(
    projectId: string,
    organizationId: string,
    dto: GenerateSubtitlesDto,
  ) {
    await this.assertOwnership(projectId, organizationId);
    const project = await this.getProject(projectId, organizationId);

    if (!project.outputUrl) {
      throw new BadRequestException('Project must be rendered before generating subtitles from audio');
    }

    const dbJob = await this.prisma.videoJob.create({
      data: {
        videoProjectId: projectId,
        jobType:        VideoJobType.GENERATE_SUBS,
        status:         VideoJobStatus.QUEUED,
      },
    });

    const bullJob = await this.queue.add(
      'subtitles',
      {
        type:      'subtitles',
        projectId,
        audioUrl:  project.outputUrl,
        language:  dto.language ?? 'en',
        organizationId,
      },
      { attempts: 2 },
    );

    await this.prisma.videoJob.update({
      where: { id: dbJob.id },
      data:  { bullJobId: String(bullJob.id) },
    });

    return { jobId: dbJob.id, bullJobId: bullJob.id };
  }

  async getSubtitles(projectId: string, organizationId: string) {
    await this.assertOwnership(projectId, organizationId);
    return this.prisma.subtitleTrack.findMany({ where: { videoProjectId: projectId } });
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private async assertOwnership(projectId: string, organizationId: string): Promise<void> {
    const project = await this.prisma.videoProject.findFirst({
      where: { id: projectId },
      select: { organizationId: true },
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (project.organizationId !== organizationId) throw new ForbiddenException('Access denied');
  }

  private resolveResolution(ratio: '16:9' | '9:16' | '1:1'): [number, number] {
    if (ratio === '9:16') return [1080, 1920];
    if (ratio === '1:1')  return [1080, 1080];
    return [1920, 1080];
  }
}
