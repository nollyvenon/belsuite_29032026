/**
 * AI Gateway — Admin Controller
 * Full CRUD for models, budgets, feature assignments, and observability.
 *
 * GET    /admin/ai-gateway/models                    — list all models
 * PATCH  /admin/ai-gateway/models/:id                — update model config
 * POST   /admin/ai-gateway/models/:id/enable         — enable model
 * POST   /admin/ai-gateway/models/:id/disable        — disable model
 * POST   /admin/ai-gateway/models/:id/reset-circuit  — reset circuit breaker
 *
 * GET    /admin/ai-gateway/health                    — full health per model
 * GET    /admin/ai-gateway/stats                     — system-wide stats
 * GET    /admin/ai-gateway/cache/stats               — cache stats
 * POST   /admin/ai-gateway/cache/flush               — flush all cached entries
 *
 * GET    /admin/ai-gateway/requests                  — paginated request log
 * GET    /admin/ai-gateway/usage                     — usage report
 *
 * GET    /admin/ai-gateway/budgets                   — list all budget configs
 * PUT    /admin/ai-gateway/budgets                   — upsert a budget config
 *
 * GET    /admin/ai-gateway/feature-assignments       — list feature→model map
 * PUT    /admin/ai-gateway/feature-assignments       — upsert assignment
 *
 * GET    /admin/ai-gateway/task-capability-map       — task → required capabilities
 * GET    /admin/ai-gateway/compare-providers         — cost comparison
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ModelRegistryService }  from '../services/model-registry.service';
import { UsageTrackerService }   from '../services/usage-tracker.service';
import { FailoverService }       from '../services/failover.service';
import { AICacheService }        from '../services/ai-cache.service';
import { CostOptimizerService }  from '../services/cost-optimizer.service';
import { TaskRouterService }     from '../services/task-router.service';
import {
  UpdateModelDto,
  UpsertBudgetDto,
  UpsertFeatureAssignmentDto,
  RequestLogQueryDto,
  UsageQueryDto,
} from '../dto/gateway.dto';

@Controller('admin/ai-gateway')
export class AdminGatewayController {
  private readonly logger = new Logger(AdminGatewayController.name);

  constructor(
    private readonly registry:   ModelRegistryService,
    private readonly usage:      UsageTrackerService,
    private readonly failover:   FailoverService,
    private readonly cache:      AICacheService,
    private readonly optimizer:  CostOptimizerService,
    private readonly router:     TaskRouterService,
  ) {}

  // ── Model Registry ─────────────────────────────────────────────────────

  @Get('models')
  async listModels() {
    return this.registry.getAllModels();
  }

  @Patch('models/:id')
  async updateModel(@Param('id') id: string, @Body() dto: UpdateModelDto) {
    return this.registry.updateModel(id, dto);
  }

  @Post('models/:id/enable')
  @HttpCode(HttpStatus.OK)
  async enableModel(@Param('id') id: string) {
    return this.registry.enableModel(id);
  }

  @Post('models/:id/disable')
  @HttpCode(HttpStatus.OK)
  async disableModel(@Param('id') id: string) {
    return this.registry.disableModel(id);
  }

  @Post('models/:id/reset-circuit')
  @HttpCode(HttpStatus.OK)
  async resetCircuit(@Param('id') id: string) {
    this.failover.resetCircuit(id);
    return { message: `Circuit reset for model ${id}` };
  }

  // ── Health & Stats ─────────────────────────────────────────────────────

  @Get('health')
  async getHealth() {
    const models = await this.registry.getAllModels();
    return this.failover.getAllHealth(models);
  }

  @Get('stats')
  async getStats() {
    return this.usage.getSystemStats();
  }

  // ── Cache ──────────────────────────────────────────────────────────────

  @Get('cache/stats')
  async getCacheStats() {
    return this.cache.getStats();
  }

  @Post('cache/flush')
  @HttpCode(HttpStatus.OK)
  async flushCache() {
    await this.cache.flushAll();
    return { message: 'AI cache flushed' };
  }

  // ── Request Log ────────────────────────────────────────────────────────

  @Get('requests')
  async getRequests(@Query() q: RequestLogQueryDto) {
    return this.usage.getRecentRequests({
      organizationId: q.organizationId,
      feature:        q.feature,
      provider:       q.provider,
      cacheHit:       q.cacheHit,
      success:        q.success,
      fromDate:       q.fromDate ? new Date(q.fromDate) : undefined,
      toDate:         q.toDate   ? new Date(q.toDate)   : undefined,
      limit:          q.limit  ? Number(q.limit)  : 50,
      offset:         q.offset ? Number(q.offset) : 0,
    });
  }

  // ── Usage Report ───────────────────────────────────────────────────────

  @Get('usage')
  async getUsage(@Query() q: UsageQueryDto) {
    return this.usage.getUsageReport(
      q.organizationId,
      q.fromDate ? new Date(q.fromDate) : undefined,
      q.toDate   ? new Date(q.toDate)   : undefined,
    );
  }

  // ── Budget Config ──────────────────────────────────────────────────────

  @Get('budgets')
  async listBudgets() {
    return this.usage.getAllBudgets();
  }

  @Put('budgets')
  async upsertBudget(@Body() dto: UpsertBudgetDto) {
    return this.usage.upsertBudget(dto);
  }

  // ── Feature Assignments ────────────────────────────────────────────────

  @Get('feature-assignments')
  async listFeatureAssignments() {
    return this.registry.getFeatureAssignments();
  }

  @Put('feature-assignments')
  async upsertFeatureAssignment(@Body() dto: UpsertFeatureAssignmentDto) {
    return this.registry.upsertFeatureAssignment(dto);
  }

  // ── Routing Metadata ───────────────────────────────────────────────────

  @Get('task-capability-map')
  getTaskCapabilityMap() {
    return this.router.getTaskCapabilityMap();
  }

  @Get('compare-providers')
  async compareProviders(
    @Query('inputTokens')  inputTokens  = '500',
    @Query('outputTokens') outputTokens = '500',
  ) {
    const models = await this.registry.getAllModels();
    return this.optimizer.compareProviders(
      models,
      Number(inputTokens),
      Number(outputTokens),
    );
  }
}
