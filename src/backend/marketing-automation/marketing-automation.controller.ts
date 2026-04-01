import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CurrentUser } from '../common/decorators/user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Tenant } from '../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import {
  AutoOptimizeAbTestDto,
  CreateMarketingAutomationCampaignDto,
  GenerateMarketingCopyDto,
  LaunchCampaignDto,
  MarketingAutomationListQueryDto,
  OptimizeSendTimeDto,
  TriggerWorkflowEventDto,
  TwilioStatusCallbackDto,
  UpdateMarketingAutomationCampaignDto,
} from './dto/marketing-automation.dto';
import { MarketingAutomationService } from './marketing-automation.service';

@Controller('api/marketing-automation')
@UseGuards(JwtAuthGuard)
export class MarketingAutomationController {
  constructor(private readonly marketingAutomationService: MarketingAutomationService) {}

  @Post('campaigns')
  @HttpCode(HttpStatus.CREATED)
  createCampaign(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateMarketingAutomationCampaignDto,
  ): Promise<any> {
    return this.marketingAutomationService.createCampaign(organizationId, userId, dto);
  }

  @Get('campaigns')
  listCampaigns(
    @Tenant() organizationId: string,
    @Query() query: MarketingAutomationListQueryDto,
  ): Promise<any> {
    return this.marketingAutomationService.listCampaigns(organizationId, query);
  }

  @Get('campaigns/:campaignId')
  getCampaign(
    @Tenant() organizationId: string,
    @Param('campaignId') campaignId: string,
  ): Promise<any> {
    return this.marketingAutomationService.getCampaign(organizationId, campaignId);
  }

  @Patch('campaigns/:campaignId')
  updateCampaign(
    @Tenant() organizationId: string,
    @Param('campaignId') campaignId: string,
    @Body() dto: UpdateMarketingAutomationCampaignDto,
  ): Promise<any> {
    return this.marketingAutomationService.updateCampaign(organizationId, campaignId, dto);
  }

  @Post('campaigns/:campaignId/activate')
  activateCampaign(
    @Tenant() organizationId: string,
    @Param('campaignId') campaignId: string,
  ): Promise<any> {
    return this.marketingAutomationService.setCampaignActive(organizationId, campaignId, true);
  }

  @Post('campaigns/:campaignId/deactivate')
  deactivateCampaign(
    @Tenant() organizationId: string,
    @Param('campaignId') campaignId: string,
  ): Promise<any> {
    return this.marketingAutomationService.setCampaignActive(organizationId, campaignId, false);
  }

  @Post('campaigns/:campaignId/launch')
  launchCampaign(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Param('campaignId') campaignId: string,
    @Body() dto: LaunchCampaignDto,
  ): Promise<any> {
    return this.marketingAutomationService.launchCampaign(organizationId, userId, campaignId, dto);
  }

  @Post('events/trigger')
  triggerEvent(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: TriggerWorkflowEventDto,
  ): Promise<any> {
    return this.marketingAutomationService.triggerEvent(organizationId, userId, dto);
  }

  @Post('ai/copy/generate')
  generateCopy(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: GenerateMarketingCopyDto,
  ): Promise<any> {
    return this.marketingAutomationService.generateCopy(organizationId, userId, dto);
  }

  @Post('ai/send-time/optimize')
  optimizeSendTime(
    @Tenant() organizationId: string,
    @Body() dto: OptimizeSendTimeDto,
  ): Promise<any> {
    return this.marketingAutomationService.optimizeSendTime(organizationId, dto);
  }

  @Post('ai/ab-tests/optimize')
  autoOptimizeAbTest(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: AutoOptimizeAbTestDto,
  ): Promise<any> {
    return this.marketingAutomationService.autoOptimizeAbTest(organizationId, userId, dto);
  }

  @Get('stats')
  getStats(
    @Tenant() organizationId: string,
    @Query('days') days?: string,
  ): Promise<any> {
    return this.marketingAutomationService.getStats(organizationId, Number(days) || 30);
  }

  @Public()
  @Post('webhooks/twilio/status')
  @HttpCode(HttpStatus.OK)
  ingestTwilioStatus(
    @Body() dto: TwilioStatusCallbackDto,
    @Req() req: Request,
  ): Promise<any> {
    const callbackUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const signature = req.headers['x-twilio-signature'];
    return this.marketingAutomationService.ingestTwilioStatusCallback(
      callbackUrl,
      dto,
      Array.isArray(signature) ? signature[0] : signature,
    );
  }

  @Public()
  @Post('webhooks/twilio/voice-status')
  @HttpCode(HttpStatus.OK)
  ingestTwilioVoiceStatus(
    @Body() dto: TwilioStatusCallbackDto,
    @Req() req: Request,
  ): Promise<any> {
    const callbackUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const signature = req.headers['x-twilio-signature'];
    return this.marketingAutomationService.ingestTwilioStatusCallback(
      callbackUrl,
      dto,
      Array.isArray(signature) ? signature[0] : signature,
    );
  }
}
