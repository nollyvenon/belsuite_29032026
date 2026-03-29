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
import { CurrentUser } from '../common/decorators/user.decorator';
import { Tenant } from '../common/decorators/tenant.decorator';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto';

@Controller('api/content')
@UseGuards(JwtAuthGuard)
export class ContentController {
  constructor(private contentService: ContentService) {}

  /**
   * POST /api/content
   * Create new content
   */
  @Post()
  async create(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() createDto: CreateContentDto,
  ) {
    return this.contentService.createContent(organizationId, userId, createDto);
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
  async update(
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
    );
  }

  /**
   * DELETE /api/content/:contentId
   * Delete content
   */
  @Delete(':contentId')
  @HttpCode(204)
  async delete(
    @Tenant() organizationId: string,
    @Param('contentId') contentId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.contentService.deleteContent(contentId, organizationId, userId);
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
