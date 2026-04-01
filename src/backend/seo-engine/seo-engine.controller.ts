import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { Tenant } from '../common/decorators/tenant.decorator';
import {
  BacklinkQueryDto,
  CompetitorBacklinkAnalysisDto,
  GenerateSeoContentDto,
  KeywordClusterDto,
  OutreachEmailDto,
  TrackBacklinkDto,
} from './dto/seo-engine.dto';
import { SeoEngineService } from './seo-engine.service';

@Controller('api/seo-engine')
@UseGuards(JwtAuthGuard)
export class SeoEngineController {
  constructor(private readonly seoEngineService: SeoEngineService) {}

  @Post('content/generate')
  @HttpCode(HttpStatus.CREATED)
  generateSeoContent(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: GenerateSeoContentDto,
  ) {
    return this.seoEngineService.generateSeoContent(organizationId, userId, dto);
  }

  @Post('backlinks/track')
  @HttpCode(HttpStatus.CREATED)
  trackBacklink(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: TrackBacklinkDto,
  ) {
    return this.seoEngineService.trackBacklink(organizationId, userId, dto);
  }

  @Get('backlinks')
  listBacklinks(@Tenant() organizationId: string, @Query() query: BacklinkQueryDto) {
    return this.seoEngineService.listBacklinks(organizationId, query);
  }

  @Post('backlinks/competitors/analyze')
  analyzeCompetitorBacklinks(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CompetitorBacklinkAnalysisDto,
  ) {
    return this.seoEngineService.analyzeCompetitorBacklinks(organizationId, userId, dto);
  }

  @Post('keywords/cluster')
  generateKeywordClusters(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: KeywordClusterDto,
  ) {
    return this.seoEngineService.generateKeywordClusters(organizationId, userId, dto);
  }

  @Post('outreach/email/generate')
  generateOutreachEmail(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: OutreachEmailDto,
  ) {
    return this.seoEngineService.generateOutreachEmail(organizationId, userId, dto);
  }

  @Get('stats')
  getStats(@Tenant() organizationId: string, @Query('days') days?: string) {
    return this.seoEngineService.getSeoStats(organizationId, Number(days) || 30);
  }
}
