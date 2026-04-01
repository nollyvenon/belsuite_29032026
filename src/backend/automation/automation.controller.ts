import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { Tenant } from '../common/decorators/tenant.decorator';
import {
  AutomationListQueryDto,
  AutomationStatsQueryDto,
  CreateWorkflowDto,
  UpdateWorkflowDto,
} from './dto/automation.dto';
import { AutomationService } from './automation.service';

@Controller('api/automation')
@UseGuards(JwtAuthGuard)
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post('workflows')
  createWorkflow(@Tenant() organizationId: string, @Body() dto: CreateWorkflowDto) {
    return this.automationService.createWorkflow(organizationId, dto);
  }

  @Get('workflows')
  listWorkflows(@Tenant() organizationId: string, @Query() query: AutomationListQueryDto) {
    return this.automationService.listWorkflows(organizationId, query);
  }

  @Get('workflows/:workflowId')
  getWorkflow(@Tenant() organizationId: string, @Param('workflowId') workflowId: string) {
    return this.automationService.getWorkflow(organizationId, workflowId);
  }

  @Patch('workflows/:workflowId')
  updateWorkflow(
    @Tenant() organizationId: string,
    @Param('workflowId') workflowId: string,
    @Body() dto: UpdateWorkflowDto,
  ) {
    return this.automationService.updateWorkflow(organizationId, workflowId, dto);
  }

  @Delete('workflows/:workflowId')
  @HttpCode(204)
  async deleteWorkflow(@Tenant() organizationId: string, @Param('workflowId') workflowId: string) {
    await this.automationService.deleteWorkflow(organizationId, workflowId);
  }

  @Post('workflows/:workflowId/activate')
  activateWorkflow(@Tenant() organizationId: string, @Param('workflowId') workflowId: string) {
    return this.automationService.setWorkflowActive(organizationId, workflowId, true);
  }

  @Post('workflows/:workflowId/deactivate')
  deactivateWorkflow(@Tenant() organizationId: string, @Param('workflowId') workflowId: string) {
    return this.automationService.setWorkflowActive(organizationId, workflowId, false);
  }

  @Post('workflows/:workflowId/execute')
  executeWorkflow(
    @Tenant() organizationId: string,
    @Param('workflowId') workflowId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.automationService.executeWorkflow(organizationId, workflowId, userId);
  }

  @Get('stats')
  getStats(@Tenant() organizationId: string, @Query() query: AutomationStatsQueryDto) {
    return this.automationService.getAutomationStats(organizationId, query.days ?? 30);
  }
}
