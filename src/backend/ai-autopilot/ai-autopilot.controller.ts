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
import {
  AIAutopilotListQueryDto,
  CreateAutopilotPolicyDto,
  TriggerAutopilotRunDto,
} from './dto/ai-autopilot.dto';
import { AIAutopilotService } from './ai-autopilot.service';

@Controller('api/ai-autopilot')
@UseGuards(JwtAuthGuard)
export class AIAutopilotController {
  constructor(private readonly autopilotService: AIAutopilotService) {}

  @Post('policies')
  @HttpCode(HttpStatus.CREATED)
  createPolicy(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateAutopilotPolicyDto,
  ) {
    return this.autopilotService.createPolicy(organizationId, userId, dto);
  }

  @Get('policies')
  listPolicies(@Tenant() organizationId: string) {
    return this.autopilotService.listPolicies(organizationId);
  }

  @Post('runs/trigger')
  @HttpCode(HttpStatus.CREATED)
  triggerRun(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: TriggerAutopilotRunDto,
  ) {
    return this.autopilotService.triggerRun(organizationId, userId, dto);
  }

  @Get('runs')
  listRuns(
    @Tenant() organizationId: string,
    @Query() query: AIAutopilotListQueryDto,
  ) {
    return this.autopilotService.listRuns(organizationId, query);
  }

  @Get('insights')
  getInsights(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Query('days') days?: string,
  ) {
    return this.autopilotService.getInsights(organizationId, userId, Number(days) || 30);
  }
}
