import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  Res,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { VideoEditorService } from './video-editor.service';
import {
  CreateProjectRequest,
  UpdateProjectRequest,
  AddClipRequest,
  UpdateClipRequest,
  GenerateAutoCaptionRequest,
  ExportVideoRequest,
  VideoProject,
  VideoClip,
  VideoRender,
  EditingState,
} from '../../types/video-editor.types';

@Controller('api/video-editor')
@UseGuards(AuthGuard)
export class VideoEditorController {
  constructor(private videoEditorService: VideoEditorService) {}

  // ── PROJECT MANAGEMENT ──────────────────────────────────────────────────

  /**
   * Create a new video project
   */
  @Post('projects')
  async createProject(
    @Request() req: any,
    @Body() createProjectDto: CreateProjectRequest,
  ): Promise<VideoProject> {
    if (!createProjectDto.title) {
      throw new BadRequestException('Title is required');
    }

    return this.videoEditorService.createProject(req.user.organizationId, req.user.id, createProjectDto);
  }

  /**
   * Get all projects for organization
   */
  @Get('projects')
  async listProjects(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ): Promise<{ projects: VideoProject[]; total: number }> {
    return this.videoEditorService.listProjects(req.user.organizationId, {
      status: status as any,
      limit,
      offset,
    });
  }

  /**
   * Get specific project
   */
  @Get('projects/:projectId')
  async getProject(@Request() req: any, @Param('projectId') projectId: string): Promise<VideoProject> {
    const project = await this.videoEditorService.getProject(projectId);

    if (!project || project.organizationId !== req.user.organizationId) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  /**
   * Update project metadata
   */
  @Put('projects/:projectId')
  async updateProject(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Body() updateDto: UpdateProjectRequest,
  ): Promise<VideoProject> {
    const project = await this.videoEditorService.getProject(projectId);

    if (!project || project.organizationId !== req.user.organizationId) {
      throw new ForbiddenException('Cannot update this project');
    }

    return this.videoEditorService.updateProject(projectId, updateDto);
  }

  /**
   * Delete project
   */
  @Delete('projects/:projectId')
  async deleteProject(@Request() req: any, @Param('projectId') projectId: string): Promise<void> {
    const project = await this.videoEditorService.getProject(projectId);

    if (!project || project.organizationId !== req.user.organizationId) {
      throw new ForbiddenException('Cannot delete this project');
    }

    await this.videoEditorService.deleteProject(projectId);
  }

  // ── EDITING STATE ───────────────────────────────────────────────────────

  /**
   * Save editing state (auto-save & manual save)
   */
  @Post('projects/:projectId/save-state')
  async saveEditingState(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Body() editingState: EditingState,
  ): Promise<VideoProject> {
    const project = await this.videoEditorService.getProject(projectId);

    if (!project || project.organizationId !== req.user.organizationId) {
      throw new ForbiddenException('Cannot save state for this project');
    }

    return this.videoEditorService.saveEditingState(projectId, editingState);
  }

  /**
   * Get editing state
   */
  @Get('projects/:projectId/state')
  async getEditingState(@Request() req: any, @Param('projectId') projectId: string): Promise<EditingState> {
    const project = await this.videoEditorService.getProject(projectId);

    if (!project || project.organizationId !== req.user.organizationId) {
      throw new ForbiddenException('Cannot access this project');
    }

    return this.videoEditorService.getEditingState(projectId);
  }

  // ── CLIP MANAGEMENT ─────────────────────────────────────────────────────

  /**
   * Add clip to project
   */
  @Post('projects/:projectId/clips')
  async addClip(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Body() addClipDto: AddClipRequest,
  ): Promise<VideoClip> {
    const project = await this.videoEditorService.getProject(projectId);

    if (!project || project.organizationId !== req.user.organizationId) {
      throw new ForbiddenException('Cannot add clip to this project');
    }

    return this.videoEditorService.addClip(projectId, addClipDto);
  }

  /**
   * Update clip properties
   */
  @Put('clips/:clipId')
  async updateClip(@Request() req: any, @Param('clipId') clipId: string, @Body() updateDto: UpdateClipRequest): Promise<VideoClip> {
    const clip = await this.videoEditorService.getClip(clipId);

    if (!clip) {
      throw new NotFoundException('Clip not found');
    }

    // Verify ownership
    const project = await this.videoEditorService.getProject(clip.projectId);
    if (!project || project.organizationId !== req.user.organizationId) {
      throw new ForbiddenException('Cannot update this clip');
    }

    return this.videoEditorService.updateClip(clipId, updateDto);
  }

  /**
   * Delete clip
   */
  @Delete('clips/:clipId')
  async deleteClip(@Request() req: any, @Param('clipId') clipId: string): Promise<void> {
    const clip = await this.videoEditorService.getClip(clipId);

    if (!clip) {
      throw new NotFoundException('Clip not found');
    }

    const project = await this.videoEditorService.getProject(clip.projectId);
    if (!project || project.organizationId !== req.user.organizationId) {
      throw new ForbiddenException('Cannot delete this clip');
    }

    await this.videoEditorService.deleteClip(clipId);
  }

  // ── AUTO-CAPTIONS ───────────────────────────────────────────────────────

  /**
   * Generate captions via speech-to-text
   */
  @Post('clips/:clipId/generate-captions')
  async generateCaptions(
    @Request() req: any,
    @Param('clipId') clipId: string,
    @Body() requestDto: GenerateAutoCaptionRequest,
  ): Promise<any> {
    const clip = await this.videoEditorService.getClip(clipId);

    if (!clip) {
      throw new NotFoundException('Clip not found');
    }

    const project = await this.videoEditorService.getProject(clip.projectId);
    if (!project || project.organizationId !== req.user.organizationId) {
      throw new ForbiddenException('Cannot generate captions for this clip');
    }

    return this.videoEditorService.generateAutoCaption(clipId, requestDto);
  }

  // ── BACKGROUND REMOVAL ──────────────────────────────────────────────────

  /**
   * Remove background from clip using AI
   */
  @Post('clips/:clipId/remove-background')
  async removeBackground(@Request() req: any, @Param('clipId') clipId: string): Promise<any> {
    const clip = await this.videoEditorService.getClip(clipId);

    if (!clip) {
      throw new NotFoundException('Clip not found');
    }

    const project = await this.videoEditorService.getProject(clip.projectId);
    if (!project || project.organizationId !== req.user.organizationId) {
      throw new ForbiddenException('Cannot process this clip');
    }

    return this.videoEditorService.removeBackground(clipId);
  }

  // ── AI FEATURES ─────────────────────────────────────────────────────────

  /**
   * Auto-generate editing suggestions using AI
   */
  @Post('projects/:projectId/auto-edit')
  async autoEdit(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Body() options: { analysisType?: string; scriptInput?: string },
  ): Promise<any> {
    const project = await this.videoEditorService.getProject(projectId);

    if (!project || project.organizationId !== req.user.organizationId) {
      throw new ForbiddenException('Cannot auto-edit this project');
    }

    return this.videoEditorService.autoEdit(projectId, options);
  }

  /**
   * Detect scenes in video
   */
  @Post('clips/:clipId/detect-scenes')
  async detectScenes(@Request() req: any, @Param('clipId') clipId: string): Promise<any> {
    const clip = await this.videoEditorService.getClip(clipId);

    if (!clip) {
      throw new NotFoundException('Clip not found');
    }

    const project = await this.videoEditorService.getProject(clip.projectId);
    if (!project || project.organizationId !== req.user.organizationId) {
      throw new ForbiddenException('Cannot process this clip');
    }

    return this.videoEditorService.detectScenes(clipId);
  }

  /**
   * Detect highlights in video (faces, action, movement)
   */
  @Post('clips/:clipId/detect-highlights')
  async detectHighlights(@Request() req: any, @Param('clipId') clipId: string): Promise<any> {
    const clip = await this.videoEditorService.getClip(clipId);

    if (!clip) {
      throw new NotFoundException('Clip not found');
    }

    const project = await this.videoEditorService.getProject(clip.projectId);
    if (!project || project.organizationId !== req.user.organizationId) {
      throw new ForbiddenException('Cannot process this clip');
    }

    return this.videoEditorService.detectHighlights(clipId);
  }

  /**
   * Remove silence from clip
   */
  @Post('clips/:clipId/remove-silence')
  async removeSilence(
    @Request() req: any,
    @Param('clipId') clipId: string,
    @Body() options: { threshold?: number; minDuration?: number },
  ): Promise<any> {
    const clip = await this.videoEditorService.getClip(clipId);

    if (!clip) {
      throw new NotFoundException('Clip not found');
    }

    const project = await this.videoEditorService.getProject(clip.projectId);
    if (!project || project.organizationId !== req.user.organizationId) {
      throw new ForbiddenException('Cannot process this clip');
    }

    return this.videoEditorService.removeSilence(clipId, options);
  }

  // ── RENDERING & EXPORT ──────────────────────────────────────────────────

  /**
   * Start rendering / export video
   */
  @Post('projects/:projectId/render')
  async renderVideo(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Body() exportSettings: ExportVideoRequest,
  ): Promise<VideoRender> {
    const project = await this.videoEditorService.getProject(projectId);

    if (!project || project.organizationId !== req.user.organizationId) {
      throw new ForbiddenException('Cannot render this project');
    }

    return this.videoEditorService.renderVideo(projectId, req.user.id, exportSettings);
  }

  /**
   * Get render status
   */
  @Get('renders/:renderId')
  async getRenderStatus(@Request() req: any, @Param('renderId') renderId: string): Promise<VideoRender> {
    const render = await this.videoEditorService.getRender(renderId);

    if (!render) {
      throw new NotFoundException('Render not found');
    }

    const project = await this.videoEditorService.getProject(render.projectId);
    if (!project || project.organizationId !== req.user.organizationId) {
      throw new ForbiddenException('Cannot access this render');
    }

    return render;
  }

  /**
   * Download rendered video
   */
  @Get('renders/:renderId/download')
  async downloadVideo(@Request() req: any, @Param('renderId') renderId: string, @Res() res: Response): Promise<void> {
    const render = await this.videoEditorService.getRender(renderId);

    if (!render || !render.outputUrl) {
      throw new NotFoundException('Render not found or not ready');
    }

    const project = await this.videoEditorService.getProject(render.projectId);
    if (!project || project.organizationId !== req.user.organizationId) {
      throw new ForbiddenException('Cannot download this render');
    }

    // Redirect to S3 or stream the file
    res.redirect(render.outputUrl);
  }

  /**
   * Cancel render job
   */
  @Post('renders/:renderId/cancel')
  async cancelRender(@Request() req: any, @Param('renderId') renderId: string): Promise<void> {
    const render = await this.videoEditorService.getRender(renderId);

    if (!render) {
      throw new NotFoundException('Render not found');
    }

    const project = await this.videoEditorService.getProject(render.projectId);
    if (!project || project.organizationId !== req.user.organizationId) {
      throw new ForbiddenException('Cannot cancel this render');
    }

    await this.videoEditorService.cancelRender(renderId);
  }

  // ── VERSIONING ──────────────────────────────────────────────────────────

  /**
   * Create version snapshot
   */
  @Post('projects/:projectId/versions')
  async createVersion(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Body() versionDto: { name?: string },
  ): Promise<any> {
    const project = await this.videoEditorService.getProject(projectId);

    if (!project || project.organizationId !== req.user.organizationId) {
      throw new ForbiddenException('Cannot version this project');
    }

    return this.videoEditorService.createVersion(projectId, req.user.id, versionDto);
  }

  /**
   * List versions
   */
  @Get('projects/:projectId/versions')
  async listVersions(@Request() req: any, @Param('projectId') projectId: string): Promise<any[]> {
    const project = await this.videoEditorService.getProject(projectId);

    if (!project || project.organizationId !== req.user.organizationId) {
      throw new ForbiddenException('Cannot access this project');
    }

    return this.videoEditorService.listVersions(projectId);
  }

  /**
   * Restore version
   */
  @Post('projects/:projectId/versions/:versionId/restore')
  async restoreVersion(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
  ): Promise<VideoProject> {
    const project = await this.videoEditorService.getProject(projectId);

    if (!project || project.organizationId !== req.user.organizationId) {
      throw new ForbiddenException('Cannot restore this project');
    }

    return this.videoEditorService.restoreVersion(projectId, versionId);
  }

  // ── HEALTH & UTILITY ────────────────────────────────────────────────────

  /**
   * Get render queue status
   */
  @Get('render-queue')
  async getRenderQueue(@Request() req: any): Promise<any> {
    return this.videoEditorService.getRenderQueueStatus(req.user.organizationId);
  }

  /**
   * Get organization storage usage
   */
  @Get('storage/usage')
  async getStorageUsage(@Request() req: any): Promise<any> {
    return this.videoEditorService.getStorageUsage(req.user.organizationId);
  }
}
