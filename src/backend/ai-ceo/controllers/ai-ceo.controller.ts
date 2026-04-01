import { Controller, Get, Post, Param, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

import { AICEOService } from '../services/ai-ceo.service';
import {
  GenerateDecisionDto,
  GenerateReportDto,
  DecisionResponseDto,
  ReportResponseDto,
  DashboardOverviewDto,
  DecisionHistoryDto,
} from '../dto/ai-ceo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

/**
 * AI CEO Controller
 * Exposes AI decision-making and reporting endpoints for admin dashboard
 */
@ApiTags('AI CEO')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('api/admin/ai-ceo')
export class AICEOController {
  private readonly logger = new Logger(AICEOController.name);

  constructor(private aiCeoService: AICEOService) {}

  /**
   * Generate AI decision
   * POST /api/admin/ai-ceo/decisions
   */
  @Post('decisions')
  @ApiOperation({ summary: 'Generate AI CEO decision' })
  @ApiResponse({ status: 201, description: 'Decision generated', type: DecisionResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async generateDecision(@Body() dto: GenerateDecisionDto): Promise<DecisionResponseDto> {
    this.logger.log(`Generating ${dto.decisionType} decision for org: ${dto.organizationId}`);

    return this.aiCeoService.generateDecision(dto.organizationId, dto.decisionType);
  }

  /**
   * Generate AI report
   * POST /api/admin/ai-ceo/reports
   */
  @Post('reports')
  @ApiOperation({ summary: 'Generate AI CEO report' })
  @ApiResponse({ status: 201, description: 'Report generated', type: ReportResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async generateReport(@Body() dto: GenerateReportDto): Promise<ReportResponseDto> {
    this.logger.log(`Generating ${dto.frequency} report for org: ${dto.organizationId}`);

    return this.aiCeoService.generateReport(dto.organizationId, dto.frequency);
  }

  /**
   * Get dashboard overview
   * GET /api/admin/ai-ceo/dashboard/:organizationId
   */
  @Get('dashboard/:organizationId')
  @ApiOperation({ summary: 'Get AI CEO dashboard overview' })
  @ApiResponse({ status: 200, description: 'Dashboard data', type: DashboardOverviewDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getDashboard(@Param('organizationId') organizationId: string): Promise<DashboardOverviewDto> {
    this.logger.log(`Fetching AI CEO dashboard for org: ${organizationId}`);

    return this.aiCeoService.getDashboardOverview(organizationId);
  }

  /**
   * Apply (implement) decision
   * POST /api/admin/ai-ceo/decisions/:decisionId/apply
   */
  @Post('decisions/:decisionId/apply')
  @ApiOperation({ summary: 'Apply AI decision recommendation' })
  @ApiResponse({ status: 204, description: 'Decision applied' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Decision not found' })
  async applyDecision(
    @Param('decisionId') decisionId: string,
    @Body('organizationId') organizationId: string,
  ): Promise<void> {
    this.logger.log(`Applying decision: ${decisionId} for org: ${organizationId}`);

    await this.aiCeoService.applyDecision(organizationId, decisionId);
  }

  /**
   * Get decision history
   * GET /api/admin/ai-ceo/decisions/history/:organizationId
   */
  @Get('decisions/history/:organizationId')
  @ApiOperation({ summary: 'Get decision history with impact tracking' })
  @ApiResponse({ status: 200, description: 'Decision history', type: [DecisionHistoryDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getDecisionHistory(
    @Param('organizationId') organizationId: string,
  ): Promise<DecisionHistoryDto[]> {
    this.logger.log(`Fetching decision history for org: ${organizationId}`);

    return this.aiCeoService.getDecisionHistory(organizationId);
  }

  /**
   * Health check
   * GET /api/admin/ai-ceo/health
   */
  @Get('health')
  @ApiOperation({ summary: 'AI CEO system health check' })
  @ApiResponse({ status: 200, description: 'Health status' })
  async healthCheck(): Promise<{ status: string; message: string }> {
    return {
      status: 'healthy',
      message: 'AI CEO system operational',
    };
  }
}
