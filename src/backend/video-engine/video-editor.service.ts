import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { VideoRenderingPipeline } from './rendering-pipeline';
import {
  VideoProject,
  VideoClip,
  VideoRender,
  EditingState,
  CreateProjectRequest,
  UpdateProjectRequest,
  AddClipRequest,
  UpdateClipRequest,
  GenerateAutoCaptionRequest,
  ExportVideoRequest,
  VideoProjectStatus,
} from '../../types/video-editor.types';

@Injectable()
export class VideoEditorService {
  private readonly logger = new Logger(VideoEditorService.name);
  private renderingPipeline: VideoRenderingPipeline;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.renderingPipeline = new VideoRenderingPipeline(this.config);
  }

  // ── PROJECT MANAGEMENT ──────────────────────────────────────────────────

  async createProject(organizationId: string, userId: string, createDto: CreateProjectRequest): Promise<VideoProject> {
    const project = await this.prisma.videoProject.create({
      data: {
        organizationId,
        createdBy: userId,
        title: createDto.title,
        description: createDto.description,
        aspectRatio: createDto.aspectRatio,
        resolution: createDto.resolution || '1080p',
        fps: createDto.fps || 30,
        status: 'DRAFT',
        editingState: {
          projectId: '', // Will be updated below
          clips: [],
          duration: 0,
          audioTracks: [],
          zoom: 1,
          currentTime: 0,
          scale: 100,
          gridSize: 16,
        } as any,
      },
    } as any);

    // Update editing state with project ID
    await this.prisma.videoProject.update({
      where: { id: project.id },
      data: {
        editingState: {
          projectId: project.id,
          clips: [],
          duration: 0,
          audioTracks: [],
          zoom: 1,
          currentTime: 0,
          scale: 100,
          gridSize: 16,
        },
      },
    } as any);

    this.logger.log(`Created video project: ${project.id} for org: ${organizationId}`);
    return this.formatProject(project);
  }

  async listProjects(organizationId: string, options: { status?: string; limit: number; offset: number }): Promise<{ projects: VideoProject[]; total: number }> {
    const [projects, total] = await Promise.all([
      this.prisma.videoProject.findMany({
        where: {
          organizationId,
          ...(options.status && { status: options.status }),
        },
        take: options.limit,
        skip: options.offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.videoProject.count({
        where: {
          organizationId,
          ...(options.status && { status: options.status }),
        },
      }),
    ]);

    return {
      projects: projects.map(p => this.formatProject(p)),
      total,
    };
  }

  async getProject(projectId: string): Promise<VideoProject | null> {
    const project = await this.prisma.videoProject.findUnique({
      where: { id: projectId },
      include: {
        sourceVideos: {
          include: { audioTracks: true },
        },
        versions: true,
      },
    } as any);

    return project ? this.formatProject(project) : null;
  }

  async updateProject(projectId: string, updateDto: UpdateProjectRequest): Promise<VideoProject> {
    const project = await this.prisma.videoProject.update({
      where: { id: projectId },
      data: {
        ...(updateDto.title && { title: updateDto.title }),
        ...(updateDto.description && { description: updateDto.description }),
        ...(updateDto.status && { status: updateDto.status }),
      },
    } as any);

    return this.formatProject(project);
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.prisma.videoProject.delete({
      where: { id: projectId },
    } as any);

    this.logger.log(`Deleted video project: ${projectId}`);
  }

  // ── EDITING STATE ───────────────────────────────────────────────────────

  async saveEditingState(projectId: string, editingState: EditingState): Promise<VideoProject> {
    // Calculate total project duration
    const maxEndTime = editingState.clips.length
      ? Math.max(...editingState.clips.map(c => c.endTime))
      : 0;

    const project = await this.prisma.videoProject.update({
      where: { id: projectId },
      data: {
        editingState: editingState as any,
        duration: maxEndTime,
        status: 'EDITING',
        lastEditedAt: new Date(),
      },
    } as any);

    this.logger.debug(`Saved editing state for project: ${projectId} (${editingState.clips.length} clips)`);
    return this.formatProject(project);
  }

  async getEditingState(projectId: string): Promise<EditingState> {
    const project = await this.prisma.videoProject.findUnique({
      where: { id: projectId },
    } as any);

    return project?.editingState || this.getDefaultEditingState(projectId);
  }

  private getDefaultEditingState(projectId: string): EditingState {
    return {
      projectId,
      clips: [],
      duration: 0,
      audioTracks: [],
      zoom: 1,
      currentTime: 0,
      scale: 100,
      gridSize: 16,
    };
  }

  // ── CLIP MANAGEMENT ─────────────────────────────────────────────────────

  async addClip(projectId: string, addClipDto: AddClipRequest): Promise<VideoClip> {
    // Validate video by fetching metadata from URL
    const metadata = await this.getVideoMetadata(addClipDto.sourceUrl);

    const clip = await this.prisma.videoClip.create({
      data: {
        projectId,
        sourceUrl: addClipDto.sourceUrl,
        fileName: addClipDto.fileName,
        fileSize: metadata.fileSize || 0,
        duration: metadata.duration || 0,
        width: metadata.width || 1920,
        height: metadata.height || 1080,
        startTime: addClipDto.startTime || 0,
        endTime: addClipDto.endTime || metadata.duration || 0,
        displayOrder: addClipDto.displayOrder || 0,
      },
    } as any);

    this.logger.log(`Added clip to project: ${projectId}`);
    return this.formatClip(clip);
  }

  async updateClip(clipId: string, updateDto: UpdateClipRequest): Promise<VideoClip> {
    const clip = await this.prisma.videoClip.update({
      where: { id: clipId },
      data: {
        ...(updateDto.speed !== undefined && { speed: updateDto.speed }),
        ...(updateDto.volume !== undefined && { volume: updateDto.volume }),
        ...(updateDto.opacity !== undefined && { opacity: updateDto.opacity }),
        ...(updateDto.rotation !== undefined && { rotation: updateDto.rotation }),
        ...(updateDto.brightness !== undefined && { brightness: updateDto.brightness }),
        ...(updateDto.contrast !== undefined && { contrast: updateDto.contrast }),
        ...(updateDto.saturation !== undefined && { saturation: updateDto.saturation }),
        ...(updateDto.transitionIn && { transitionIn: updateDto.transitionIn }),
        ...(updateDto.transitionOut && { transitionOut: updateDto.transitionOut }),
      },
    } as any);

    return this.formatClip(clip);
  }

  async getClip(clipId: string): Promise<VideoClip | null> {
    const clip = await this.prisma.videoClip.findUnique({
      where: { id: clipId },
      include: { audioTracks: true },
    } as any);

    return clip ? this.formatClip(clip) : null;
  }

  async deleteClip(clipId: string): Promise<void> {
    await this.prisma.videoClip.delete({
      where: { id: clipId },
    } as any);

    this.logger.log(`Deleted clip: ${clipId}`);
  }

  // ── AUTO-CAPTIONS ───────────────────────────────────────────────────────

  async generateAutoCaption(clipId: string, requestDto: GenerateAutoCaptionRequest): Promise<any> {
    const clip = await this.prisma.videoClip.findUnique({
      where: { id: clipId },
    } as any);

    if (!clip) throw new Error('Clip not found');

    // Start async caption generation job
    const caption = await this.prisma.videoCaption.upsert({
      where: { clipId },
      update: {},
      create: {
        clipId,
        sourceType: 'AUTO',
        font: 'Arial',
        fontSize: 24,
        color: '#FFFFFF',
        position: 'BOTTOM',
        opacity: 100,
        language: requestDto.language || 'en',
      },
    } as any);

    // Queue async job to extract transcript
    this.queueCaptionGeneration(clipId, clip.sourceUrl, requestDto.language || 'en').catch(err =>
      this.logger.error(`Failed to generate captions: ${err.message}`),
    );

    return { captionId: caption.id, status: 'PROCESSING' };
  }

  private async queueCaptionGeneration(clipId: string, videoUrl: string, language: string): Promise<void> {
    // TODO: Use Bull queue or similar for async jobs
    // For now, using setTimeout as placeholder
    setTimeout(async () => {
      try {
        // Use speech-to-text API (Google Cloud Speech-to-Text, AWS Transcribe, etc.)
        const transcript = await this.transcribeAudio(videoUrl, language);

        await this.prisma.videoCaption.update({
          where: { clipId },
          data: {
            transcript: transcript as any,
          },
        } as any);

        this.logger.log(`Generated captions for clip: ${clipId}`);
      } catch (err) {
        this.logger.error(`Caption generation failed: ${err}`);
      }
    }, 1000);
  }

  private async transcribeAudio(videoUrl: string, language: string): Promise<any[]> {
    // Placeholder for speech-to-text API call
    // In production: use Google Cloud Speech-to-Text, AWS Transcribe, or Deepgram
    return [
      { startTime: 0, endTime: 5, text: 'This is a sample caption...' },
      { startTime: 5, endTime: 10, text: 'From speech to text conversion' },
    ];
  }

  // ── BACKGROUND REMOVAL ──────────────────────────────────────────────────

  async removeBackground(clipId: string): Promise<any> {
    const clip = await this.prisma.videoClip.findUnique({
      where: { id: clipId },
    } as any);

    if (!clip) throw new Error('Clip not found');

    // Queue async background removal job
    await this.prisma.videoClip.update({
      where: { id: clipId },
      data: { backgroundRemoved: true }, // Start processing indicator
    } as any);

    // Process in background using background removal AI model
    this.queueBackgroundRemoval(clipId, clip.sourceUrl).catch(err =>
      this.logger.error(`Failed to remove background: ${err.message}`),
    );

    return { clipId, status: 'PROCESSING' };
  }

  private async queueBackgroundRemoval(clipId: string, videoUrl: string): Promise<void> {
    // Placeholder for background removal processing
    // In production: use REMBG, MediaPipe, or similar ML models
    this.logger.log(`Queued background removal for clip: ${clipId}`);
  }

  // ── AI FEATURES ─────────────────────────────────────────────────────────

  async autoEdit(projectId: string, options: { analysisType?: string; scriptInput?: string }): Promise<any> {
    const project = await this.prisma.videoProject.findUnique({
      where: { id: projectId },
      include: { sourceVideos: true },
    } as any);

    if (!project) throw new Error('Project not found');

    // Create auto-editing job
    const job = await this.prisma.autoEditingJob.upsert({
      where: { projectId },
      update: {},
      create: {
        projectId,
        status: 'ANALYZING',
        analysisType: options.analysisType || 'highlight_reel',
        aiModel: 'gpt-4-vision',
        scriptInput: options.scriptInput,
      },
    } as any);

    // Process asynchronously
    this.queueAutoEdit(projectId, job.id).catch(err =>
      this.logger.error(`Auto-edit failed: ${err.message}`),
    );

    return { jobId: job.id, status: 'ANALYZING' };
  }

  private async queueAutoEdit(projectId: string, jobId: string): Promise<void> {
    // Use AI to analyze video and suggest edits
    // Suggested: GPT-4 Vision API or Claude's vision capabilities
    this.logger.log(`Analyzing project for auto-editing: ${projectId}`);
  }

  async detectScenes(clipId: string): Promise<any> {
    const clip = await this.prisma.videoClip.findUnique({
      where: { id: clipId },
    } as any);

    if (!clip) throw new Error('Clip not found');

    // Run scene detection asynchronously
    this.queueSceneDetection(clipId, clip.sourceUrl).catch(err =>
      this.logger.error(`Scene detection failed: ${err.message}`),
    );

    return { clipId, status: 'ANALYZING' };
  }

  private async queueSceneDetection(clipId: string, videoUrl: string): Promise<void> {
    // Use computer vision to detect scene changes
    // Suggested: OpenCV, FFmpeg scene detection, or PySceneDetect
    this.logger.log(`Detecting scenes in clip: ${clipId}`);
  }

  async detectHighlights(clipId: string): Promise<any> {
    const clip = await this.prisma.videoClip.findUnique({
      where: { id: clipId },
    } as any);

    if (!clip) throw new Error('Clip not found');

    this.queueHighlightDetection(clipId, clip.sourceUrl).catch(err =>
      this.logger.error(`Highlight detection failed: ${err.message}`),
    );

    return { clipId, status: 'ANALYZING' };
  }

  private async queueHighlightDetection(clipId: string, videoUrl: string): Promise<void> {
    // Use face detection, motion detection, and sound analysis
    // Suggested: MediaPipe, YOLO, or cloud-based APIs
    this.logger.log(`Detecting highlights in clip: ${clipId}`);
  }

  async removeSilence(clipId: string, options: { threshold?: number; minDuration?: number }): Promise<any> {
    const clip = await this.prisma.videoClip.findUnique({
      where: { id: clipId },
    } as any);

    if (!clip) throw new Error('Clip not found');

    // Queue silence removal job
    this.queueSilenceRemoval(clipId, clip.sourceUrl, options).catch(err =>
      this.logger.error(`Silence removal failed: ${err.message}`),
    );

    return { clipId, status: 'PROCESSING' };
  }

  private async queueSilenceRemoval(clipId: string, videoUrl: string, options: any): Promise<void> {
    // Use audio analysis to detect and remove silence
    // Suggested: FFmpeg audio detection filters or librosa
    this.logger.log(`Removing silence from clip: ${clipId}`);
  }

  // ── RENDERING & EXPORT ──────────────────────────────────────────────────

  async renderVideo(projectId: string, userId: string, exportSettings: ExportVideoRequest): Promise<VideoRender> {
    const project = await this.prisma.videoProject.findUnique({
      where: { id: projectId },
      include: { sourceVideos: true },
    } as any);

    if (!project) throw new Error('Project not found');

    // Create render job
    const render = await this.prisma.videoRender.create({
      data: {
        projectId,
        format: exportSettings.format,
        quality: exportSettings.quality,
        bitrate: this.calculateBitrate(exportSettings.quality),
        status: 'QUEUED',
      },
    } as any);

    // Queue rendering job
    this.renderingPipeline.queueRender(projectId, render.id, project, exportSettings).catch(err =>
      this.logger.error(`Rendering failed: ${err.message}`),
    );

    this.logger.log(`Queued render job: ${render.id} for project: ${projectId}`);
    return this.formatRender(render);
  }

  private calculateBitrate(quality: string): string {
    const bitrateMap: Record<string, string> = {
      low: '3M',
      medium: '6M',
      high: '12M',
      ultra: '25M',
    };
    return bitrateMap[quality] || '10M';
  }

  async getRender(renderId: string): Promise<VideoRender | null> {
    const render = await this.prisma.videoRender.findUnique({
      where: { id: renderId },
    } as any);

    return render ? this.formatRender(render) : null;
  }

  async cancelRender(renderId: string): Promise<void> {
    await this.prisma.videoRender.update({
      where: { id: renderId },
      data: { status: 'CANCELLED' },
    } as any);

    this.logger.log(`Cancelled render job: ${renderId}`);
  }

  // ── VERSIONING ──────────────────────────────────────────────────────────

  async createVersion(projectId: string, userId: string, versionDto: { name?: string }): Promise<any> {
    const project = await this.prisma.videoProject.findUnique({
      where: { id: projectId },
    } as any);

    if (!project) throw new Error('Project not found');

    const versionCount = await this.prisma.videoProjectVersion.count({
      where: { projectId },
    } as any);

    const version = await this.prisma.videoProjectVersion.create({
      data: {
        projectId,
        versionNumber: versionCount + 1,
        name: versionDto.name || `Version ${versionCount + 1}`,
        editingState: project.editingState,
        createdBy: userId,
      },
    } as any);

    this.logger.log(`Created version for project: ${projectId}`);
    return version;
  }

  async listVersions(projectId: string): Promise<any[]> {
    return this.prisma.videoProjectVersion.findMany({
      where: { projectId },
      orderBy: { versionNumber: 'desc' },
    } as any);
  }

  async restoreVersion(projectId: string, versionId: string): Promise<VideoProject> {
    const version = await this.prisma.videoProjectVersion.findUnique({
      where: { id: versionId },
    } as any);

    if (!version) throw new Error('Version not found');

    const project = await this.prisma.videoProject.update({
      where: { id: projectId },
      data: {
        editingState: version.editingState,
        lastEditedAt: new Date(),
      },
    } as any);

    this.logger.log(`Restored project ${projectId} to version ${versionId}`);
    return this.formatProject(project);
  }

  // ── UTILITY ─────────────────────────────────────────────────────────────

  async getRenderQueueStatus(organizationId: string): Promise<any> {
    const renders = await this.prisma.videoRender.findMany({
      where: {
        project: {
          organizationId,
        },
      },
      where: { status: { in: ['QUEUED', 'PROCESSING'] } },
    } as any);

    return {
      queueLength: renders.length,
      items: renders.map(r => ({
        id: r.id,
        projectId: r.projectId,
        progress: r.progress,
        eta: this.estimateRenderTime(r),
      })),
    };
  }

  private estimateRenderTime(render: any): number {
    // Rough estimate: 1 minute of video takes ~30s to render (varies by quality)
    return Math.floor(render.duration * 0.5 * (1 - render.progress / 100));
  }

  async getStorageUsage(organizationId: string): Promise<any> {
    const projects = await this.prisma.videoProject.findMany({
      where: { organizationId },
      include: { sourceVideos: true },
    } as any);

    const totalBytes = projects.reduce((sum, project) =>
      sum + project.sourceVideos.reduce((clipSum: number, clip: any) => clipSum + (clip.fileSize || 0), 0), 0
    );

    return {
      usedGB: (totalBytes / (1024 * 1024 * 1024)).toFixed(2),
      limitGB: 100, // Default limit
      projectCount: projects.length,
      clipCount: projects.reduce((sum, p) => sum + p.sourceVideos.length, 0),
    };
  }

  // ── HELPERS ─────────────────────────────────────────────────────────────

  private async getVideoMetadata(videoUrl: string): Promise<{ duration: number; fileSize: number; width: number; height: number }> {
    // TODO: Use FFprobe or similar to extract metadata
    return { duration: 10, fileSize: 1000000, width: 1920, height: 1080 };
  }

  private formatProject(project: any): VideoProject {
    return {
      ...project,
      editingState: project.editingState ? (project.editingState as EditingState) : null,
    };
  }

  private formatClip(clip: any): VideoClip {
    return clip as VideoClip;
  }

  private formatRender(render: any): VideoRender {
    return render as VideoRender;
  }
}
