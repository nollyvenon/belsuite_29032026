import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { Tenant } from '../common/decorators/tenant.decorator';
import {
  EnrichLeadDto,
  LeadListQueryDto,
  PredictLeadStrategyDto,
  ScrapeLeadsDto,
  TrackVisitorDto,
} from './dto/lead-engine.dto';
import { LeadEngineService } from './lead-engine.service';

@Controller('api/lead-engine')
@UseGuards(JwtAuthGuard)
export class LeadEngineController {
  constructor(private readonly leadEngineService: LeadEngineService) {}

  @Post('scrape')
  @HttpCode(HttpStatus.CREATED)
  scrapeLeads(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: ScrapeLeadsDto,
  ) {
    return this.leadEngineService.ingestScrapedLeads(organizationId, userId, dto);
  }

  @Get('leads')
  listLeads(@Tenant() organizationId: string, @Query() query: LeadListQueryDto) {
    return this.leadEngineService.listLeads(organizationId, query);
  }

  @Post('leads/:leadId/enrich')
  enrichLead(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Param('leadId') leadId: string,
    @Body() dto: EnrichLeadDto,
  ) {
    return this.leadEngineService.enrichLead(organizationId, userId, leadId, dto);
  }

  @Post('strategy/predict')
  predictLeadStrategy(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: PredictLeadStrategyDto,
  ) {
    return this.leadEngineService.predictLeadStrategy(organizationId, userId, dto);
  }

  @Post('visitors/track')
  @HttpCode(HttpStatus.CREATED)
  trackVisitor(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: TrackVisitorDto,
  ) {
    return this.leadEngineService.trackVisitor(organizationId, userId, dto);
  }

  @Get('stats')
  getStats(@Tenant() organizationId: string, @Query('days') days?: string) {
    return this.leadEngineService.getLeadStats(organizationId, Number(days) || 30);
  }
}
