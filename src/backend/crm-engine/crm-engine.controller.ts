import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/user.decorator';
import { Tenant } from '../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import {
  DispatchOutreachMessageDto,
  GenerateSequencePlanDto,
  ImportLeadToCrmDto,
  MarkConversionDto,
  PipelineQueryDto,
  StageTransitionDto,
  StartOutreachSequenceDto,
} from './dto/crm-engine.dto';
import { CrmEngineService } from './crm-engine.service';

@Controller('api/crm-engine')
@UseGuards(JwtAuthGuard)
export class CrmEngineController {
  constructor(private readonly crmEngineService: CrmEngineService) {}

  @Post('leads/import')
  @HttpCode(HttpStatus.CREATED)
  importLeadToCrm(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: ImportLeadToCrmDto,
  ) {
    return this.crmEngineService.importLeadToCrm(organizationId, userId, dto);
  }

  @Get('pipeline')
  listPipeline(@Tenant() organizationId: string, @Query() query: PipelineQueryDto) {
    return this.crmEngineService.listPipeline(organizationId, query);
  }

  @Patch('pipeline/stage')
  transitionStage(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: StageTransitionDto,
  ) {
    return this.crmEngineService.transitionStage(organizationId, userId, dto);
  }

  @Post('outreach/sequence/plan')
  generateSequencePlan(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: GenerateSequencePlanDto,
  ) {
    return this.crmEngineService.generateSequencePlan(organizationId, userId, dto);
  }

  @Post('outreach/sequence/start')
  startOutreachSequence(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: StartOutreachSequenceDto,
  ) {
    return this.crmEngineService.startOutreachSequence(organizationId, userId, dto);
  }

  @Post('outreach/dispatch')
  @HttpCode(HttpStatus.CREATED)
  dispatchOutreachMessage(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: DispatchOutreachMessageDto,
  ) {
    return this.crmEngineService.dispatchOutreachMessage(organizationId, userId, dto);
  }

  @Post('conversions/mark')
  markConversion(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: MarkConversionDto,
  ) {
    return this.crmEngineService.markConversion(organizationId, userId, dto);
  }

  @Get('stats')
  getStats(@Tenant() organizationId: string, @Query('days') days?: string) {
    return this.crmEngineService.getCrmStats(organizationId, Number(days) || 30);
  }
}
