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
import { CurrentUser } from '../common/decorators/user.decorator';
import { Tenant } from '../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { AnalyticsRangeQueryDto, TrackAnalyticsEventDto } from './dto/analytics.dto';
import { AnalyticsDashboardService } from './services/analytics-dashboard.service';
import { AnalyticsRecommendationService } from './services/analytics-recommendation.service';
import { AnalyticsTrackingService } from './services/analytics-tracking.service';

@Controller('api/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly tracking: AnalyticsTrackingService,
    private readonly dashboard: AnalyticsDashboardService,
    private readonly recommendations: AnalyticsRecommendationService,
  ) {}

  @Post('track')
  @HttpCode(HttpStatus.CREATED)
  trackEvent(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: TrackAnalyticsEventDto,
  ) {
    return this.tracking.trackEvent(organizationId, userId, dto);
  }

  @Get('dashboard')
  getDashboard(
    @Tenant() organizationId: string,
    @Query() query: AnalyticsRangeQueryDto,
  ) {
    return this.dashboard.getDashboard(organizationId, Number(query.days) || 30);
  }

  @Get('overview')
  getOverview(
    @Tenant() organizationId: string,
    @Query() query: AnalyticsRangeQueryDto,
  ) {
    return this.dashboard.getOverview(organizationId, Number(query.days) || 30);
  }

  @Get('charts/performance')
  getPerformanceChart(
    @Tenant() organizationId: string,
    @Query() query: AnalyticsRangeQueryDto,
  ) {
    return this.dashboard.getPerformanceChart(organizationId, Number(query.days) || 30);
  }

  @Get('charts/engagement')
  getEngagementBreakdown(
    @Tenant() organizationId: string,
    @Query() query: AnalyticsRangeQueryDto,
  ) {
    return this.dashboard.getEngagementBreakdown(organizationId, Number(query.days) || 30);
  }

  @Get('charts/revenue')
  getRevenueAttribution(
    @Tenant() organizationId: string,
    @Query() query: AnalyticsRangeQueryDto,
  ) {
    return this.dashboard.getRevenueAttribution(organizationId, Number(query.days) || 30);
  }

  @Get('content/top')
  getTopContent(
    @Tenant() organizationId: string,
    @Query() query: AnalyticsRangeQueryDto & { limit?: string },
  ) {
    return this.dashboard.getTopContent(
      organizationId,
      Number(query.days) || 30,
      Math.min(Number(query.limit) || 10, 20),
    );
  }

  @Get('recommendations')
  getRecommendations(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Query() query: AnalyticsRangeQueryDto,
  ) {
    return this.recommendations.getRecommendations(organizationId, userId, Number(query.days) || 30);
  }
}