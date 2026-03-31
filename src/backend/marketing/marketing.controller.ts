/**
 * Marketing Engine Controller
 * REST API for all marketing features: campaigns, ads, A/B tests,
 * budget optimization, funnel builder, conversion tracking, ad platform connections.
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { Tenant } from '../common/decorators/tenant.decorator';

import { CampaignManagerService } from './services/campaign-manager.service';
import { AdGeneratorService } from './services/ad-generator.service';
import { ABTestService } from './services/ab-test.service';
import { BudgetOptimizerService } from './services/budget-optimizer.service';
import { PerformanceTrackingService } from './services/performance-tracking.service';
import { FunnelBuilderService } from './services/funnel-builder.service';
import { FacebookAdsService } from './services/platforms/facebook-ads.service';
import { GoogleAdsService } from './services/platforms/google-ads.service';
import { CampaignObjectiveEnum, AdFormatEnum, AdPlatformEnum } from './marketing.types';

@Controller('api/marketing')
@UseGuards(JwtAuthGuard)
export class MarketingController {
  private readonly logger = new Logger(MarketingController.name);

  constructor(
    private campaigns: CampaignManagerService,
    private adGenerator: AdGeneratorService,
    private abTests: ABTestService,
    private budgetOptimizer: BudgetOptimizerService,
    private performance: PerformanceTrackingService,
    private funnels: FunnelBuilderService,
    private facebookAds: FacebookAdsService,
    private googleAds: GoogleAdsService,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════

  @Get('dashboard')
  async getDashboard(
    @Tenant() organizationId: string,
    @Query('days') days?: string,
  ) {
    return this.performance.getDashboardOverview(
      organizationId,
      days ? parseInt(days, 10) : 30,
    );
  }

  @Get('portfolio/recommendations')
  async getPortfolioRecommendations(@Tenant() organizationId: string) {
    return this.budgetOptimizer.getPortfolioRecommendations(organizationId);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CAMPAIGNS
  // ══════════════════════════════════════════════════════════════════════════

  @Get('campaigns')
  async listCampaigns(
    @Tenant() organizationId: string,
    @Query('status') status?: string,
  ) {
    return this.campaigns.listCampaigns(organizationId, status);
  }

  @Get('campaigns/:id')
  async getCampaign(
    @Tenant() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.campaigns.getCampaign(organizationId, id);
  }

  @Post('campaigns')
  @HttpCode(HttpStatus.CREATED)
  async createCampaign(
    @Tenant() organizationId: string,
    @Body()
    body: {
      name: string;
      description?: string;
      objective: CampaignObjectiveEnum;
      dailyBudget?: number;
      totalBudget?: number;
      startDate?: string;
      endDate?: string;
      adAccountId?: string;
      audienceJson?: string;
    },
  ) {
    return this.campaigns.createCampaign(organizationId, body);
  }

  @Patch('campaigns/:id')
  async updateCampaign(
    @Tenant() organizationId: string,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      dailyBudget?: number;
      totalBudget?: number;
      startDate?: string;
      endDate?: string;
      audienceJson?: string;
    },
  ) {
    return this.campaigns.updateCampaign(organizationId, id, body);
  }

  @Patch('campaigns/:id/status')
  async setCampaignStatus(
    @Tenant() organizationId: string,
    @Param('id') id: string,
    @Body() body: { status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' },
  ) {
    return this.campaigns.setStatus(organizationId, id, body.status);
  }

  @Delete('campaigns/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCampaign(
    @Tenant() organizationId: string,
    @Param('id') id: string,
  ) {
    await this.campaigns.deleteCampaign(organizationId, id);
  }

  @Get('campaigns/:id/chart')
  async getCampaignChart(
    @Tenant() organizationId: string,
    @Param('id') id: string,
    @Query('days') days?: string,
  ) {
    return this.performance.getCampaignChart(
      organizationId,
      id,
      days ? parseInt(days, 10) : 30,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ADS
  // ══════════════════════════════════════════════════════════════════════════

  @Post('campaigns/:id/ads')
  @HttpCode(HttpStatus.CREATED)
  async createAd(
    @Tenant() organizationId: string,
    @Param('id') campaignId: string,
    @Body()
    body: {
      name: string;
      format: string;
      headline?: string;
      body?: string;
      callToAction?: string;
      destinationUrl?: string;
      creativeAssets?: string;
    },
  ) {
    return this.campaigns.createAd(organizationId, campaignId, body);
  }

  @Patch('ads/:adId/status')
  async setAdStatus(
    @Tenant() organizationId: string,
    @Param('adId') adId: string,
    @Body() body: { status: 'ACTIVE' | 'PAUSED' | 'DRAFT' },
  ) {
    return this.campaigns.updateAdStatus(organizationId, adId, body.status);
  }

  @Delete('ads/:adId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAd(
    @Tenant() organizationId: string,
    @Param('adId') adId: string,
  ) {
    await this.campaigns.deleteAd(organizationId, adId);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AI AD GENERATION
  // ══════════════════════════════════════════════════════════════════════════

  @Post('ai/generate-ads')
  @HttpCode(HttpStatus.OK)
  async generateAds(
    @Tenant() organizationId: string,
    @Body()
    body: {
      businessName: string;
      productOrService: string;
      targetAudience: string;
      objective: CampaignObjectiveEnum;
      platform: AdPlatformEnum;
      format: AdFormatEnum;
      tone?: string;
      brandVoice?: string;
      keyBenefits?: string[];
      budget?: number;
      variantCount?: number;
    },
  ) {
    return this.adGenerator.generateAds(organizationId, body);
  }

  @Post('campaigns/:id/ai/save-ads')
  @HttpCode(HttpStatus.CREATED)
  async saveGeneratedAds(
    @Tenant() organizationId: string,
    @Param('id') campaignId: string,
    @Body()
    body: {
      result: any;
      request: any;
    },
  ) {
    const adIds = await this.adGenerator.saveGeneratedAds(
      organizationId,
      campaignId,
      body.result,
      body.request,
    );
    return { adIds };
  }

  @Post('ai/creative-prompts')
  @HttpCode(HttpStatus.OK)
  async generateCreativePrompts(
    @Tenant() organizationId: string,
    @Body()
    body: {
      productOrService: string;
      targetAudience: string;
      platform: AdPlatformEnum;
      format: AdFormatEnum;
      tone?: string;
      count?: number;
    },
  ) {
    return this.adGenerator.generateCreativePrompts(organizationId, body);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // A/B TESTS
  // ══════════════════════════════════════════════════════════════════════════

  @Get('campaigns/:id/ab-tests')
  async listABTests(
    @Tenant() organizationId: string,
    @Param('id') campaignId: string,
  ) {
    return this.abTests.listTests(organizationId, campaignId);
  }

  @Post('campaigns/:id/ab-tests')
  @HttpCode(HttpStatus.CREATED)
  async createABTest(
    @Tenant() organizationId: string,
    @Param('id') campaignId: string,
    @Body()
    body: {
      name: string;
      hypothesis?: string;
      metric: 'ctr' | 'cvr' | 'cpc' | 'roas';
      confidenceLevel?: number;
      minimumSampleSize?: number;
      trafficSplit?: Record<string, number>;
    },
  ) {
    return this.abTests.createTest(organizationId, campaignId, body);
  }

  @Post('ab-tests/:testId/start')
  @HttpCode(HttpStatus.OK)
  async startABTest(
    @Tenant() organizationId: string,
    @Param('testId') testId: string,
    @Body()
    body: {
      adId: string;
      variants: Array<{
        label: string;
        headline?: string;
        body?: string;
        callToAction?: string;
        isControl?: boolean;
      }>;
    },
  ) {
    return this.abTests.startTest(organizationId, testId, body.adId, body.variants);
  }

  @Get('ab-tests/:testId/analysis')
  async getABTestAnalysis(
    @Tenant() organizationId: string,
    @Param('testId') testId: string,
  ) {
    return this.abTests.getTestWithAnalysis(organizationId, testId);
  }

  @Delete('ab-tests/:testId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteABTest(
    @Tenant() organizationId: string,
    @Param('testId') testId: string,
  ) {
    await this.abTests.deleteTest(organizationId, testId);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BUDGET OPTIMIZATION
  // ══════════════════════════════════════════════════════════════════════════

  @Post('campaigns/:id/optimize-budget')
  @HttpCode(HttpStatus.OK)
  async optimizeBudget(
    @Tenant() organizationId: string,
    @Param('id') id: string,
    @Body() body: { totalBudget?: number },
  ) {
    return this.budgetOptimizer.optimizeCampaignBudget(
      organizationId,
      id,
      body.totalBudget,
    );
  }

  @Post('campaigns/:id/apply-optimization')
  @HttpCode(HttpStatus.OK)
  async applyOptimization(
    @Tenant() organizationId: string,
    @Param('id') id: string,
    @Body() body: { result: any },
  ) {
    return this.budgetOptimizer.applyOptimization(organizationId, id, body.result);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONVERSION TRACKING
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Public endpoint — no JWT required — called from frontend pixel
   */
  @Post('track')
  @HttpCode(HttpStatus.OK)
  async trackConversion(
    @Body()
    body: {
      organizationId: string;
      eventType: string;
      eventName?: string;
      adId?: string;
      funnelPageId?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmContent?: string;
      utmTerm?: string;
      clickId?: string;
      sessionId?: string;
      visitorId?: string;
      value?: number;
      currency?: string;
      metadataJson?: string;
    },
    @Req() req: Request,
  ) {
    return this.performance.recordConversion(body.organizationId, {
      ...body,
      ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
        req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      referrer: req.headers['referer'],
    });
  }

  @Get('conversions/funnel')
  async getConversionFunnel(
    @Tenant() organizationId: string,
    @Query('campaign') utmCampaign?: string,
    @Query('days') days?: string,
  ) {
    return this.performance.getConversionFunnel(
      organizationId,
      utmCampaign,
      days ? parseInt(days, 10) : 30,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FUNNELS
  // ══════════════════════════════════════════════════════════════════════════

  @Get('funnels')
  async listFunnels(@Tenant() organizationId: string) {
    return this.funnels.listFunnels(organizationId);
  }

  @Get('funnels/:id')
  async getFunnel(
    @Tenant() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.funnels.getFunnel(organizationId, id);
  }

  @Post('funnels')
  @HttpCode(HttpStatus.CREATED)
  async createFunnel(
    @Tenant() organizationId: string,
    @Body()
    body: {
      name: string;
      description?: string;
      slug: string;
      domain?: string;
      themeJson?: string;
    },
  ) {
    return this.funnels.createFunnel(organizationId, body);
  }

  @Patch('funnels/:id')
  async updateFunnel(
    @Tenant() organizationId: string,
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; domain?: string; themeJson?: string },
  ) {
    return this.funnels.updateFunnel(organizationId, id, body);
  }

  @Post('funnels/:id/publish')
  async publishFunnel(
    @Tenant() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.funnels.publishFunnel(organizationId, id);
  }

  @Post('funnels/:id/unpublish')
  async unpublishFunnel(
    @Tenant() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.funnels.unpublishFunnel(organizationId, id);
  }

  @Delete('funnels/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFunnel(
    @Tenant() organizationId: string,
    @Param('id') id: string,
  ) {
    await this.funnels.deleteFunnel(organizationId, id);
  }

  @Get('funnels/:id/analytics')
  async getFunnelAnalytics(
    @Tenant() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.funnels.getFunnelAnalytics(organizationId, id);
  }

  // Funnel pages
  @Post('funnels/:id/pages')
  @HttpCode(HttpStatus.CREATED)
  async addFunnelPage(
    @Tenant() organizationId: string,
    @Param('id') funnelId: string,
    @Body()
    body: {
      pageType: string;
      title: string;
      slug: string;
      blocksJson?: string;
      ctaText?: string;
      ctaUrl?: string;
      metaTitle?: string;
      metaDescription?: string;
    },
  ) {
    return this.funnels.addPage(organizationId, funnelId, body);
  }

  @Patch('funnels/:id/pages/reorder')
  async reorderPages(
    @Tenant() organizationId: string,
    @Param('id') funnelId: string,
    @Body() body: { pageIds: string[] },
  ) {
    return this.funnels.reorderPages(organizationId, funnelId, body.pageIds);
  }

  @Patch('funnels/pages/:pageId')
  async updatePage(
    @Tenant() organizationId: string,
    @Param('pageId') pageId: string,
    @Body()
    body: {
      title?: string;
      blocksJson?: string;
      ctaText?: string;
      ctaUrl?: string;
      metaTitle?: string;
      metaDescription?: string;
    },
  ) {
    return this.funnels.updatePage(organizationId, pageId, body);
  }

  @Delete('funnels/pages/:pageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePage(
    @Tenant() organizationId: string,
    @Param('pageId') pageId: string,
  ) {
    await this.funnels.deletePage(organizationId, pageId);
  }

  // AI funnel generation
  @Post('ai/generate-funnel')
  @HttpCode(HttpStatus.CREATED)
  async generateFunnel(
    @Tenant() organizationId: string,
    @Body()
    body: {
      businessName: string;
      productOrService: string;
      targetAudience: string;
      objective: 'leads' | 'sales' | 'webinar' | 'app_download' | 'free_trial';
      funnelType: 'squeeze' | 'sales' | 'webinar' | 'tripwire' | 'membership';
      tone?: string;
      pricePoint?: number;
      keyBenefits?: string[];
    },
  ) {
    return this.funnels.generateFunnelWithAI(organizationId, body);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AD PLATFORM CONNECTIONS
  // ══════════════════════════════════════════════════════════════════════════

  @Get('connections/facebook/oauth-url')
  getFacebookOAuthUrl(
    @Tenant() organizationId: string,
    @Query('redirectUri') redirectUri: string,
  ) {
    const url = this.facebookAds.getOAuthUrl(organizationId, redirectUri);
    return { url };
  }

  @Post('connections/facebook/oauth-callback')
  @HttpCode(HttpStatus.OK)
  async facebookOAuthCallback(
    @Tenant() organizationId: string,
    @Body() body: { code: string; redirectUri: string },
  ) {
    return this.facebookAds.handleOAuthCallback(
      organizationId,
      body.code,
      body.redirectUri,
    );
  }

  @Get('connections/facebook/accounts')
  async listFacebookAccounts(@Tenant() organizationId: string) {
    return this.facebookAds.listAdAccounts(organizationId);
  }

  @Get('connections/google/oauth-url')
  getGoogleOAuthUrl(
    @Tenant() organizationId: string,
    @Query('redirectUri') redirectUri: string,
  ) {
    const url = this.googleAds.getOAuthUrl(organizationId, redirectUri);
    return { url };
  }

  @Post('connections/google/oauth-callback')
  @HttpCode(HttpStatus.OK)
  async googleOAuthCallback(
    @Tenant() organizationId: string,
    @Body() body: { code: string; redirectUri: string },
  ) {
    return this.googleAds.handleOAuthCallback(
      organizationId,
      body.code,
      body.redirectUri,
    );
  }

  @Get('connections/google/accounts')
  async listGoogleAccounts(@Tenant() organizationId: string) {
    return this.googleAds.listAdAccounts(organizationId);
  }

  // Platform sync
  @Post('campaigns/:id/sync/facebook')
  async syncFacebook(
    @Tenant() organizationId: string,
    @Param('id') id: string,
    @Query('date') date?: string,
  ) {
    return this.facebookAds.syncCampaignInsights(organizationId, id, date);
  }

  @Post('campaigns/:id/sync/google')
  async syncGoogle(
    @Tenant() organizationId: string,
    @Param('id') id: string,
    @Query('date') date?: string,
  ) {
    return this.googleAds.syncCampaignInsights(organizationId, id, date);
  }

  @Post('campaigns/:id/platform/facebook')
  async createFacebookCampaign(
    @Tenant() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.facebookAds.createPlatformCampaign(organizationId, id);
  }

  @Post('campaigns/:id/platform/facebook/activate')
  async activateFacebookCampaign(
    @Tenant() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.facebookAds.activateCampaign(organizationId, id);
  }

  @Post('campaigns/:id/platform/google')
  async createGoogleCampaign(
    @Tenant() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.googleAds.createPlatformCampaign(organizationId, id);
  }
}
