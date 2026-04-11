import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { AIContentStudioService } from './ai-content-studio.service';
import { ContentVersioningService } from './ai-content-versioning.service';

@Controller('api')
export class AIContentStudioController {
  constructor(
    private readonly aiContentStudio: AIContentStudioService,
    private readonly contentVersioning: ContentVersioningService,
  ) {}

  // --- Templates ---
  @Post('templates')
  async createTemplate(@Body() dto: unknown) {
    return dto;
  }

  @Get('templates')
  async listTemplates() {
    return [];
  }

  @Get('templates/:id')
  async getTemplate(@Param('id') id: string) {
    return { id };
  }

  @Put('templates/:id')
  async updateTemplate(@Param('id') id: string, @Body() dto: unknown) {
    return { id, dto };
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string) {
    return { id, deleted: true };
  }

  // --- Content ---
  @Post('content')
  async generateContent(@Body() dto: Parameters<AIContentStudioService['generateContent']>[0]) {
    return this.aiContentStudio.generateContent(dto);
  }

  @Get('content')
  async listContent(@Query() query: Record<string, string>) {
    return { query };
  }

  @Get('content/:id')
  async getContent(@Param('id') id: string) {
    return { id };
  }

  @Put('content/:id')
  async updateContent(@Param('id') id: string, @Body() dto: unknown) {
    return { id, dto };
  }

  // --- Content Versioning ---
  @Get('content/:id/versions')
  async getVersions(@Param('id') contentId: string) {
    return this.contentVersioning.getVersions(contentId);
  }

  @Post('content/:id/regenerate')
  async regenerateContent(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return this.aiContentStudio.regenerateContent({
      content: { id, template: dto.template as never },
      params: dto,
    });
  }

  // --- Usage Logs ---
  @Get('usage-logs')
  async getUsageLogs(@Query() query: Record<string, string>) {
    return { query };
  }

  // --- Admin Controls ---
  @Get('admin/models')
  async getModels() {
    return [];
  }

  @Post('admin/token-limits')
  async setTokenLimits(@Body() dto: unknown) {
    return dto;
  }

  @Get('admin/costs')
  async getCosts(@Query() query: Record<string, string>) {
    return { query };
  }
}
