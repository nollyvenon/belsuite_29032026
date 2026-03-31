/**
 * Video Controller
 * REST API for AI video creation, editing, and rendering.
 *
 * Base: /api/video
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoProjectService } from './services/video-project.service';
import { MediaLibraryService } from './services/media-library.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import {
  CreateProjectDto,
  GenerateFromScriptDto,
  RenderProjectDto,
  UpdateTimelineDto,
  UploadUrlDto,
  GenerateSubtitlesDto,
  UpdateSceneDto,
} from './dto/video.dto';

interface AuthUser {
  id: string;
  orgId: string;
  permissions: string[];
}

@Controller('api/video')
@UseGuards(JwtAuthGuard)
export class VideoController {
  constructor(
    private readonly projects: VideoProjectService,
    private readonly media:    MediaLibraryService,
  ) {}

  // ── Projects ──────────────────────────────────────────────────────────────

  @Get('projects')
  listProjects(@CurrentUser() user: AuthUser) {
    return this.projects.listProjects(user.orgId, user.id);
  }

  @Post('projects')
  createProject(@CurrentUser() user: AuthUser, @Body() dto: CreateProjectDto) {
    return this.projects.createProject(dto, user.id, user.orgId);
  }

  @Get('projects/:id')
  getProject(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projects.getProject(id, user.orgId);
  }

  @Patch('projects/:id')
  updateProject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: Partial<{ title: string; description: string; script: string }>,
  ) {
    return this.projects.updateProject(id, user.orgId, body);
  }

  @Delete('projects/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteProject(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projects.deleteProject(id, user.orgId);
  }

  // ── AI Scene Generation ───────────────────────────────────────────────────

  @Post('projects/:id/generate')
  generateFromScript(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: GenerateFromScriptDto,
  ) {
    return this.projects.generateFromScript(id, user.orgId, dto);
  }

  // ── Timeline ──────────────────────────────────────────────────────────────

  @Get('projects/:id/timeline')
  getTimeline(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projects.getTimeline(id, user.orgId);
  }

  @Put('projects/:id/timeline')
  saveTimeline(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTimelineDto,
  ) {
    return this.projects.saveTimeline(id, user.orgId, dto);
  }

  // ── Scenes ────────────────────────────────────────────────────────────────

  @Patch('projects/:id/scenes/:sceneId')
  updateScene(
    @CurrentUser() user: AuthUser,
    @Param('id') projectId: string,
    @Param('sceneId') sceneId: string,
    @Body() dto: UpdateSceneDto,
  ) {
    return this.projects.updateScene(sceneId, projectId, user.orgId, dto);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  @Post('projects/:id/render')
  queueRender(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RenderProjectDto,
  ) {
    return this.projects.queueRender(id, user.orgId, dto);
  }

  @Get('projects/:id/render/status')
  getRenderStatus(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projects.getRenderStatus(id, user.orgId);
  }

  // ── Subtitles ─────────────────────────────────────────────────────────────

  @Post('projects/:id/subtitles/generate')
  generateSubtitles(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: GenerateSubtitlesDto,
  ) {
    return this.projects.generateSubtitles(id, user.orgId, dto);
  }

  @Get('projects/:id/subtitles')
  getSubtitles(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projects.getSubtitles(id, user.orgId);
  }

  // ── Media Library ─────────────────────────────────────────────────────────

  @Get('media')
  listMedia(@CurrentUser() user: AuthUser) {
    return this.media.listAssets(user.orgId);
  }

  @Get('projects/:id/media')
  listProjectMedia(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.media.listAssets(user.orgId, id);
  }

  @Post('media/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('projectId') projectId?: string,
  ) {
    if (!file) throw new Error('No file provided');

    // multer writes to disk — file.path is the temp file path
    return this.media.uploadFile({
      filePath:       file.path,
      originalName:   file.originalname,
      mimeType:       file.mimetype,
      organizationId: user.orgId,
      uploadedById:   user.id,
      videoProjectId: projectId,
    });
  }

  @Post('media/upload-url')
  getUploadUrl(@CurrentUser() user: AuthUser, @Body() dto: UploadUrlDto) {
    return this.media.createUploadUrl({
      organizationId: user.orgId,
      filename:       dto.filename,
      mimeType:       dto.mimeType,
    });
  }

  @Get('media/:assetId')
  getAsset(@CurrentUser() user: AuthUser, @Param('assetId') assetId: string) {
    return this.media.getAsset(assetId, user.orgId);
  }

  @Get('media/:assetId/download')
  async getDownloadUrl(@CurrentUser() user: AuthUser, @Param('assetId') assetId: string) {
    const url = await this.media.getDownloadUrl(assetId, user.orgId);
    return { url };
  }

  @Delete('media/:assetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAsset(@CurrentUser() user: AuthUser, @Param('assetId') assetId: string) {
    return this.media.deleteAsset(assetId, user.orgId);
  }
}
