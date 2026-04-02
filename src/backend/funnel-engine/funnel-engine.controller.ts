import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { Tenant } from '../common/decorators/tenant.decorator';
import { Public } from '../common/decorators/public.decorator';
import {
  AddFunnelStepDto,
  CaptureLeadDto,
  CompleteStepDto,
  CreateFormDto,
  CreateFunnelDto,
  FunnelListQueryDto,
  OptimizeConversionDto,
  SuggestFunnelStructureDto,
} from './dto/funnel-engine.dto';
import { FunnelEngineService } from './funnel-engine.service';

@Controller('api/funnel-engine')
@UseGuards(JwtAuthGuard)
export class FunnelEngineController {
  constructor(private readonly funnelEngineService: FunnelEngineService) {}

  // ─── Forms ──────────────────────────────────────────────────────────────────

  @Post('forms')
  @HttpCode(HttpStatus.CREATED)
  createForm(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateFormDto,
  ) {
    return this.funnelEngineService.createForm(organizationId, userId, dto);
  }

  @Get('forms')
  listForms(@Tenant() organizationId: string) {
    return this.funnelEngineService.listForms(organizationId);
  }

  @Get('forms/:formId')
  getForm(@Tenant() organizationId: string, @Param('formId') formId: string) {
    return this.funnelEngineService.getForm(organizationId, formId);
  }

  // ─── Funnels ─────────────────────────────────────────────────────────────────

  @Post('funnels')
  @HttpCode(HttpStatus.CREATED)
  createFunnel(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateFunnelDto,
  ) {
    return this.funnelEngineService.createFunnel(organizationId, userId, dto);
  }

  @Get('funnels')
  listFunnels(
    @Tenant() organizationId: string,
    @Query() query: FunnelListQueryDto,
  ) {
    return this.funnelEngineService.listFunnels(organizationId, query);
  }

  @Get('funnels/:funnelId')
  getFunnel(
    @Tenant() organizationId: string,
    @Param('funnelId') funnelId: string,
  ) {
    return this.funnelEngineService.getFunnel(organizationId, funnelId);
  }

  @Post('funnels/:funnelId/steps')
  @HttpCode(HttpStatus.CREATED)
  addFunnelStep(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Param('funnelId') funnelId: string,
    @Body() dto: AddFunnelStepDto,
  ) {
    return this.funnelEngineService.addFunnelStep(organizationId, userId, funnelId, dto);
  }

  @Post('funnels/:funnelId/complete-step')
  completeStep(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Param('funnelId') funnelId: string,
    @Body() dto: CompleteStepDto,
  ) {
    return this.funnelEngineService.completeStep(organizationId, userId, funnelId, dto);
  }

  // ─── Public: Lead capture widget ─────────────────────────────────────────────
  // Public so embedded widgets on external landing pages can POST without auth.

  @Public()
  @Post('capture')
  @HttpCode(HttpStatus.CREATED)
  captureLead(@Body() dto: CaptureLeadDto, @Req() req: Request) {
    // Best-effort attribution: resolve IP if not provided by client
    const ip = (dto.ipAddress ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress) as string | undefined;

    return this.funnelEngineService.captureLead({ ...dto, ipAddress: ip });
  }

  // ─── AI ──────────────────────────────────────────────────────────────────────

  @Post('ai/optimize')
  optimizeConversion(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: OptimizeConversionDto,
  ) {
    return this.funnelEngineService.optimizeConversion(organizationId, userId, dto);
  }

  @Post('ai/suggest-structure')
  suggestFunnelStructure(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: SuggestFunnelStructureDto,
  ) {
    return this.funnelEngineService.suggestFunnelStructure(organizationId, userId, dto);
  }

  // ─── Analytics ───────────────────────────────────────────────────────────────

  @Get('stats')
  getStats(
    @Tenant() organizationId: string,
    @Query('days') days?: string,
  ) {
    return this.funnelEngineService.getStats(organizationId, Number(days) || 30);
  }
}
