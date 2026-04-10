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
import { RequirePermission } from '../../common/decorators/permission.decorator';
import { ModelRegistryService }  from '../services/model-registry.service';
import { UsageTrackerService }   from '../services/usage-tracker.service';
import { FailoverService }       from '../services/failover.service';
import { AICacheService }        from '../services/ai-cache.service';
import { CostOptimizerService }  from '../services/cost-optimizer.service';
import { TaskRouterService }     from '../services/task-router.service';
import { GatewayControlService } from '../services/gateway-control.service';
import { AIGatewayService } from '../ai-gateway.service';
import {
  UpdateModelDto,
  RegisterModelDto,
  UpsertBudgetDto,
  UpsertFeatureAssignmentDto,
  RequestLogQueryDto,
  UsageQueryDto,
  UpdateControlProfileDto,
  SetFeatureToggleDto,
  UpdateUsageLimitsDto,
  SetFeatureModelLimitDto,
  SetTenantUsageLimitDto,
  SetTenantFeatureModelLimitDto,
  SetContentTypeProviderModelDto,
  SetModelCredentialDto,
  TestModelCredentialDto,
  SetTaskRouteDto,
  UpsertTaskCatalogDto,
} from '../dto/gateway.dto';

@Controller('admin/ai-gateway')
@RequirePermission('manage:organization')
export class AdminGatewayController {
  private readonly logger = new Logger(AdminGatewayController.name);

  constructor(
    private readonly registry:   ModelRegistryService,
    private readonly usage:      UsageTrackerService,
    private readonly failover:   FailoverService,
    private readonly cache:      AICacheService,
    private readonly optimizer:  CostOptimizerService,
    private readonly router:     TaskRouterService,
    private readonly control:    GatewayControlService,
    private readonly aiGateway:  AIGatewayService,
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

  @Post('models/register')
  async registerModel(@Body() dto: RegisterModelDto) {
    return this.registry.registerModel(dto);
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

  @Get('usage-chart')
  async getUsageChart(
    @Query('days') days = '30',
    @Query('organizationId') organizationId?: string,
  ) {
    return this.usage.getUsageTimeline(Number(days), organizationId);
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
    const normalizedInput = Math.min(Math.max(Number(inputTokens) || 500, 1), 2_000_000);
    const normalizedOutput = Math.min(Math.max(Number(outputTokens) || 500, 1), 2_000_000);
    const models = await this.registry.getAllModels();
    return this.optimizer.compareProviders(
      models,
      normalizedInput,
      normalizedOutput,
    );
  }

  @Get('models/grouped-by-capability')
  async groupedModels() {
    const models = await this.registry.getAllModels();
    return {
      text: models.filter((m) => m.capabilities.includes('text')),
      image: models.filter((m) => m.capabilities.includes('image_generation')),
      voice: models.filter((m) => m.capabilities.includes('audio') || m.capabilities.includes('transcription')),
      video: models.filter((m) => m.assignedFeatures.some((f) => f.includes('video'))),
    };
  }

  @Get('control-profile')
  async getControlProfile() {
    return this.control.getControlProfile();
  }

  @Put('control-profile')
  async updateControlProfile(@Body() dto: UpdateControlProfileDto) {
    return this.control.updateControlProfile(dto);
  }

  @Get('feature-toggles')
  async getFeatureToggles() {
    return this.control.getFeatureToggles();
  }

  @Put('feature-toggles')
  async setFeatureToggle(@Body() dto: SetFeatureToggleDto) {
    return this.control.setFeatureToggle(dto.key, dto.enabled);
  }

  @Get('dashboard')
  async adminDashboard() {
    const [stats, health, cache, models, budgets, toggles, profile] = await Promise.all([
      this.usage.getSystemStats(),
      this.getHealth(),
      this.cache.getStats(),
      this.registry.getAllModels(),
      this.usage.getAllBudgets(),
      this.control.getFeatureToggles(),
      this.control.getControlProfile(),
    ]);
    return {
      stats,
      cache,
      healthSummary: {
        total: health.length,
        healthy: health.filter((h: any) => h.isHealthy).length,
        openCircuits: health.filter((h: any) => h.circuitState === 'OPEN').length,
      },
      modelSummary: {
        total: models.length,
        enabled: models.filter((m) => m.isEnabled).length,
      },
      budgets: {
        total: budgets.length,
        active: budgets.filter((b: any) => b.isActive).length,
      },
      toggles,
      profile,
      limits: await this.control.getUsageLimits(),
    };
  }

  @Get('limits')
  async getUsageLimits() {
    return this.control.getUsageLimits();
  }

  @Put('limits')
  async setUsageLimits(@Body() dto: UpdateUsageLimitsDto) {
    return this.control.setUsageLimits(dto);
  }

  @Get('feature-model-limits')
  async getFeatureModelLimits() {
    return this.control.getFeatureModelLimits();
  }

  @Put('feature-model-limits')
  async setFeatureModelLimit(@Body() dto: SetFeatureModelLimitDto) {
    return this.control.setFeatureModelLimit(dto.feature, dto.modelIds ?? []);
  }

  @Get('task-routes')
  async getTaskRoutes() {
    return this.control.getTaskRouteMap();
  }

  @Put('task-routes')
  async setTaskRoute(@Body() dto: SetTaskRouteDto) {
    return this.control.setTaskRoute(dto.task, {
      primaryModelId: dto.primaryModelId,
      fallbackModelIds: dto.fallbackModelIds ?? [],
      strategy: dto.strategy,
      maxCostUsdPerRequest: dto.maxCostUsdPerRequest,
      maxLatencyMs: dto.maxLatencyMs,
      isActive: dto.isActive,
    });
  }

  @Post('task-routes/delete')
  async deleteTaskRoute(@Body() dto: { task: string }) {
    return this.control.deleteTaskRoute(dto.task);
  }

  @Get('tasks')
  async getTaskCatalog() {
    return this.control.getTaskCatalog();
  }

  @Put('tasks')
  async upsertTaskCatalogEntry(@Body() dto: UpsertTaskCatalogDto) {
    return this.control.upsertTaskCatalogEntry({
      taskKey: dto.taskKey,
      displayName: dto.displayName,
      description: dto.description,
      isActive: dto.isActive,
    });
  }

  @Post('tasks/delete')
  async deleteTaskCatalogEntry(@Body() dto: { taskKey: string }) {
    return this.control.deleteTaskCatalogEntry(dto.taskKey);
  }

  @Get('model-consumption-guide')
  async modelConsumptionGuide() {
    const models = await this.registry.getAllModels();
    const toRow = (m: any) => ({
      id: m.id,
      displayName: m.displayName,
      provider: m.provider,
      modelId: m.modelId,
      free: (m.costPerInputToken ?? 0) === 0 && (m.costPerOutputToken ?? 0) === 0,
      inputPer1K: Number(((m.costPerInputToken ?? 0) * 1000).toFixed(6)),
      outputPer1K: Number(((m.costPerOutputToken ?? 0) * 1000).toFixed(6)),
      inputPer1M: Number(((m.costPerInputToken ?? 0) * 1_000_000).toFixed(4)),
      outputPer1M: Number(((m.costPerOutputToken ?? 0) * 1_000_000).toFixed(4)),
      exampleCost1kIn1kOut: Number((((m.costPerInputToken ?? 0) * 1000) + ((m.costPerOutputToken ?? 0) * 1000)).toFixed(6)),
      capabilities: m.capabilities,
      assignedFeatures: m.assignedFeatures,
      contextWindow: m.contextWindow,
      maxOutputTokens: m.maxOutputTokens,
    });
    const byCategory = {
      text: models.filter((m) => m.capabilities.includes('text')).map(toRow),
      video: models.filter((m) => m.capabilities.includes('video_generation')).map(toRow),
      image: models.filter((m) => m.capabilities.includes('image_generation')).map(toRow),
      ugc: models.filter((m) => m.capabilities.includes('ugc_generation') || m.assignedFeatures.includes('ugc')).map(toRow),
      audioCreation: models.filter((m) => m.capabilities.includes('audio_generation') || m.assignedFeatures.includes('audio_creation')).map(toRow),
    };
    return {
      guide: {
        tokenUnits: 'input/output costs are USD per token; guide also provides per-1K and per-1M token projections',
        quickMath: 'exampleCost1kIn1kOut = (inputPer1K + outputPer1K)',
        note: 'non-token providers (many image/video/audio/ugc tools) may be priced per render/minute in reality; set approximate token-equivalent or keep free=0 for self-hosted',
      },
      counts: Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, v.length])),
      byCategory,
    };
  }

  @Get('task-metrics')
  async taskMetrics(
    @Query('days') days = '30',
    @Query('organizationId') organizationId?: string,
  ) {
    return this.usage.getTaskLevelMetrics(Number(days), organizationId);
  }

  @Get('tenant-limits')
  async getTenantUsageLimits() {
    return this.control.getTenantUsageLimits();
  }

  @Put('tenant-limits')
  async setTenantUsageLimit(@Body() dto: SetTenantUsageLimitDto) {
    return this.control.setTenantUsageLimit(dto.organizationId, dto);
  }

  @Get('tenant-feature-model-limits')
  async getTenantFeatureModelLimits() {
    return this.control.getTenantFeatureModelLimits();
  }

  @Put('tenant-feature-model-limits')
  async setTenantFeatureModelLimit(@Body() dto: SetTenantFeatureModelLimitDto) {
    return this.control.setTenantFeatureModelLimit(dto.organizationId, dto.feature, dto.modelIds ?? []);
  }

  @Get('content-type-provider-models')
  async getContentTypeProviderModels() {
    const [map, models] = await Promise.all([
      this.control.getContentTypeProviderModelMap(),
      this.registry.getAllModels(),
    ]);
    return { map, models };
  }

  @Put('content-type-provider-models')
  async setContentTypeProviderModel(@Body() dto: SetContentTypeProviderModelDto) {
    return this.control.setContentTypeProviderModel(dto.contentType, dto.provider as any, dto.modelId);
  }

  @Get('model-credentials')
  async getModelCredentials() {
    return this.control.getModelCredentialsMasked();
  }

  @Put('model-credentials')
  async setModelCredentials(@Body() dto: SetModelCredentialDto) {
    return this.control.setModelCredentials(dto.modelId, {
      apiKey: dto.apiKey,
      baseUrl: dto.baseUrl,
      endpoint: dto.endpoint,
    });
  }

  @Post('model-credentials/test')
  async testModelCredentials(@Body() dto: TestModelCredentialDto) {
    return this.aiGateway.testModelCredential(dto.modelId);
  }
}
