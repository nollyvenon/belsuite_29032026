import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { Tenant } from '../common/decorators/tenant.decorator';
import {
  CreateUGCAvatarDto,
  CreateUGCProjectDto,
  CreateUGCRenderDto,
  CreateVoiceCloneDto,
  GenerateUGCScriptDto,
  UpdateUGCAvatarDto,
  UpdateUGCProjectDto,
  UpdateUGCScriptDto,
  UpdateVoiceCloneDto,
} from './dto/ugc.dto';
import { AvatarService } from './services/avatar.service';
import { RenderOrchestratorService } from './services/render-orchestrator.service';
import { ScriptGeneratorService } from './services/script-generator.service';
import { UGCProjectService } from './services/ugc-project.service';
import { VoiceCloneService } from './services/voice-clone.service';

@Controller('api/ugc')
@UseGuards(JwtAuthGuard)
export class UGCController {
  constructor(
    private readonly projects: UGCProjectService,
    private readonly avatars: AvatarService,
    private readonly voices: VoiceCloneService,
    private readonly scripts: ScriptGeneratorService,
    private readonly renders: RenderOrchestratorService,
  ) {}

  @Get('dashboard')
  getDashboard(@Tenant() organizationId: string) {
    return this.projects.getDashboard(organizationId);
  }

  @Get('projects')
  listProjects(@Tenant() organizationId: string) {
    return this.projects.listProjects(organizationId);
  }

  @Post('projects')
  @HttpCode(HttpStatus.CREATED)
  createProject(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateUGCProjectDto,
  ) {
    return this.projects.createProject(organizationId, userId, dto);
  }

  @Get('projects/:id')
  getProject(@Tenant() organizationId: string, @Param('id') projectId: string) {
    return this.projects.getProject(organizationId, projectId);
  }

  @Patch('projects/:id')
  updateProject(
    @Tenant() organizationId: string,
    @Param('id') projectId: string,
    @Body() dto: UpdateUGCProjectDto,
  ) {
    return this.projects.updateProject(organizationId, projectId, dto);
  }

  @Delete('projects/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProject(@Tenant() organizationId: string, @Param('id') projectId: string) {
    await this.projects.deleteProject(organizationId, projectId);
  }

  @Post('projects/:id/publish')
  publishProject(@Tenant() organizationId: string, @Param('id') projectId: string) {
    return this.projects.publishProject(organizationId, projectId);
  }

  @Post('projects/:id/generate-script')
  generateScript(
    @Tenant() organizationId: string,
    @Param('id') projectId: string,
    @Body() dto: GenerateUGCScriptDto,
  ) {
    return this.scripts.generateScript(organizationId, projectId, dto);
  }

  @Put('projects/:id/script')
  saveScript(
    @Tenant() organizationId: string,
    @Param('id') projectId: string,
    @Body() dto: UpdateUGCScriptDto,
  ) {
    return this.projects.saveScript(organizationId, projectId, dto);
  }

  @Get('projects/:id/renders')
  listRenders(@Tenant() organizationId: string, @Param('id') projectId: string) {
    return this.renders.listRenders(organizationId, projectId);
  }

  @Post('projects/:id/render')
  @HttpCode(HttpStatus.CREATED)
  renderProject(
    @Tenant() organizationId: string,
    @Param('id') projectId: string,
    @Body() dto: CreateUGCRenderDto,
  ) {
    return this.renders.renderProject(organizationId, projectId, dto);
  }

  @Get('avatars')
  listAvatars(@Tenant() organizationId: string) {
    return this.avatars.listAvatars(organizationId);
  }

  @Post('avatars')
  @HttpCode(HttpStatus.CREATED)
  createAvatar(@Tenant() organizationId: string, @Body() dto: CreateUGCAvatarDto) {
    return this.avatars.createAvatar(organizationId, dto);
  }

  @Patch('avatars/:id')
  updateAvatar(
    @Tenant() organizationId: string,
    @Param('id') avatarId: string,
    @Body() dto: UpdateUGCAvatarDto,
  ) {
    return this.avatars.updateAvatar(organizationId, avatarId, dto);
  }

  @Get('voices')
  listVoiceClones(@Tenant() organizationId: string) {
    return this.voices.listVoiceClones(organizationId);
  }

  @Post('voices')
  @HttpCode(HttpStatus.CREATED)
  createVoiceClone(@Tenant() organizationId: string, @Body() dto: CreateVoiceCloneDto) {
    return this.voices.createVoiceClone(organizationId, dto);
  }

  @Patch('voices/:id')
  updateVoiceClone(
    @Tenant() organizationId: string,
    @Param('id') voiceCloneId: string,
    @Body() dto: UpdateVoiceCloneDto,
  ) {
    return this.voices.updateVoiceClone(organizationId, voiceCloneId, dto);
  }
}