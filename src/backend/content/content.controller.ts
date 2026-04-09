    import { AIContentService } from '../ai-content-studio.service';
      /**
       * POST /api/content/:contentId/ai-suggest
       * Generate AI content suggestion for a draft
       */
      @Post(':contentId/ai-suggest')
      async aiSuggest(
        @Param('contentId') contentId: string,
        @Body() body: { template: any; userInput: any; aiModel?: string; tone?: string; style?: string },
        @CurrentUser('sub') userId: string,
      ) {
        // Generate AI suggestion
        const suggestion = await AIContentService.generateContent(body);
        // Optionally, save as a version or return suggestion only
        return suggestion;
      }

      /**
       * POST /api/content/:contentId/apply-ai
       * Apply AI suggestion to content (and save version)
       */
      @Post(':contentId/apply-ai')
      async applyAISuggestion(
        @Param('contentId') contentId: string,
        @Body() body: { aiText: string; aiTitle?: string; aiDescription?: string },
        @CurrentUser('sub') userId: string,
        @Tenant() organizationId: string,
      ) {
        // Save version before applying
        const content = await this.contentService.getContent(contentId, organizationId);
        await this.contentService.updateContent(contentId, organizationId, userId, {
          title: body.aiTitle || content.title,
          description: body.aiDescription || content.description,
          content: body.aiText,
        });
        return { success: true };
      }
    /**
     * GET /api/content/:contentId/diff/:versionIdA/:versionIdB
     * Diff two versions of content
     */
    @Get(':contentId/diff/:versionIdA/:versionIdB')
    async diffVersions(
      @Param('contentId') contentId: string,
      @Param('versionIdA') versionIdA: string,
      @Param('versionIdB') versionIdB: string,
    ) {
      return this.contentService.diffVersions(versionIdA, versionIdB);
    }
  /**
   * GET /api/content/:contentId/versions
   * List all versions for a content item
   */
  @Get(':contentId/versions')
  async getVersions(
    @Param('contentId') contentId: string,
  ) {
    return this.contentService.getVersions(contentId);
  }

  /**
   * POST /api/content/:contentId/restore/:versionId
   * Restore a previous version
   */
  @Post(':contentId/restore/:versionId')
  async restoreVersion(
    @Param('contentId') contentId: string,
    @Param('versionId') versionId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.contentService.restoreVersion(versionId, userId);
  }
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  HttpCode,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TeamRoleGuard } from '../common/guards/team-role.guard';
import { TeamPermissionGuard } from '../common/guards/team-permission.guard';
import { RequireTeamRole } from '../common/decorators/team-role.decorator';
import { RequireTeamPermission } from '../common/decorators/team-permission.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';
import { Tenant } from '../common/decorators/tenant.decorator';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto';

/**
 * POST /api/content/:contentId/autosave
 * Autosave a draft (does not update main content, just saves a temp version)
 */
@Post(':contentId/autosave')
async autosaveDraft(
  @Param('contentId') contentId: string,
  @Tenant() organizationId: string,
  @CurrentUser('sub') userId: string,
  @Body() updateDto: UpdateContentDto,
) {
  return this.contentService.autosaveDraft(contentId, organizationId, userId, updateDto);
}

@Controller('api/teams/:teamId/content')
@UseGuards(JwtAuthGuard, TenantGuard, TeamRoleGuard, TeamPermissionGuard)
export class ContentController {
  constructor(private contentService: ContentService) {}

  /**
   * POST /api/content
   * Create new content
   */
  @Post()
  @RequireTeamRole('EDITOR', 'OWNER')
  @RequireTeamPermission('content:create')
  async create(
    @Param('teamId') teamId: string,
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() createDto: CreateContentDto,
  ) {
    return this.contentService.createContent(organizationId, userId, createDto, teamId);
  }

  /**
   * GET /api/content
   * List content
   */
  @Get()
  async list(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.contentService.listContent(organizationId, userId, page, limit, {
      status,
      type,
    });
  }

  /**
   * GET /api/content/:contentId
   * Get content by ID
   */
  @Get(':contentId')
  async get(
    @Tenant() organizationId: string,
    @Param('contentId') contentId: string,
  ) {
    return this.contentService.getContent(contentId, organizationId);
  }

  /**
   * PUT /api/content/:contentId
   * Update content
   */
  @Put(':contentId')
  @RequireTeamRole('EDITOR', 'OWNER')
  @RequireTeamPermission('content:update')
  async update(
    @Param('teamId') teamId: string,
    @Tenant() organizationId: string,
    @Param('contentId') contentId: string,
    @CurrentUser('sub') userId: string,
    @Body() updateDto: UpdateContentDto,
  ) {
    return this.contentService.updateContent(
      contentId,
      organizationId,
      userId,
      updateDto,
      teamId,
    );
  }

  /**
   * DELETE /api/content/:contentId
   * Delete content
   */
  @Delete(':contentId')
  @HttpCode(204)
  @RequireTeamRole('OWNER')
  @RequireTeamPermission('content:delete')
  async delete(
    @Param('teamId') teamId: string,
    @Tenant() organizationId: string,
    @Param('contentId') contentId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.contentService.deleteContent(contentId, organizationId, userId, teamId);
  }

  /**
   * POST /api/content/:contentId/publish
   * Publish content
   */
  @Post(':contentId/publish')
  @HttpCode(200)
  async publish(
    @Tenant() organizationId: string,
    @Param('contentId') contentId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.contentService.publishContent(contentId, organizationId, userId);
  }

  /**
   * POST /api/content/:contentId/schedule
   * Schedule content
   */
  @Post(':contentId/schedule')
  @HttpCode(200)
  async schedule(
    @Tenant() organizationId: string,
    @Param('contentId') contentId: string,
    @CurrentUser('sub') userId: string,
    @Body() body: { scheduledAt: string },
  ) {
    return this.contentService.scheduleContent(
      contentId,
      organizationId,
      userId,
      new Date(body.scheduledAt),
    );
  }
}
