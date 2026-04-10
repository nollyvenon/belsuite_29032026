import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GatewayProvider } from '../types/gateway.types';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

type ControlMode = 'CHEAP' | 'BALANCED' | 'PREMIUM';

const KEYS = {
  mode: 'AI_CONTROL_MODE',
  costWeight: 'AI_CONTROL_COST_WEIGHT',
  qualityWeight: 'AI_CONTROL_QUALITY_WEIGHT',
  speedWeight: 'AI_CONTROL_SPEED_WEIGHT',
  cheapProviders: 'AI_CONTROL_CHEAP_PROVIDERS',
  premiumProviders: 'AI_CONTROL_PREMIUM_PROVIDERS',
  dynamic: 'AI_CONTROL_DYNAMIC_ENABLED',
  usageLimits: 'AI_CONTROL_USAGE_LIMITS',
  modelLimits: 'AI_CONTROL_MODEL_LIMITS',
  tenantUsageLimits: 'AI_CONTROL_TENANT_USAGE_LIMITS',
  tenantModelLimits: 'AI_CONTROL_TENANT_MODEL_LIMITS',
  taskRouteMap: 'AI_CONTROL_TASK_ROUTE_MAP',
  taskCatalog: 'AI_CONTROL_TASK_CATALOG',
  contentTypeProviderModelMap: 'AI_CONTENT_TYPE_PROVIDER_MODEL_MAP',
  modelCredentialsMap: 'AI_MODEL_CREDENTIALS_MAP',
} as const;

const DEFAULT_TASK_CATALOG = [
  { taskKey: 'content_generation', displayName: 'Content Generation', description: 'Long-form and short-form content generation', isActive: true },
  { taskKey: 'video_processing', displayName: 'Video Processing', description: 'Video script, summarize, and post-production AI tasks', isActive: true },
  { taskKey: 'speech_to_text', displayName: 'Speech to Text', description: 'Audio transcription and speech recognition', isActive: true },
  { taskKey: 'text_to_speech', displayName: 'Text to Speech', description: 'Generate spoken audio from text', isActive: true },
  { taskKey: 'image_generation', displayName: 'Image Generation', description: 'Text-to-image generation and editing', isActive: true },
  { taskKey: 'analytics_ai', displayName: 'Analytics AI', description: 'Business and KPI analysis tasks', isActive: true },
  { taskKey: 'chat_assistant', displayName: 'Chat Assistant', description: 'Conversational assistant workflows', isActive: true },
  { taskKey: 'moderation', displayName: 'Moderation', description: 'Safety, policy, and moderation checks', isActive: true },
  { taskKey: 'embedding', displayName: 'Embedding', description: 'Vector embedding generation', isActive: true },
  { taskKey: 'summarization', displayName: 'Summarization', description: 'Long content summarization', isActive: true },
  { taskKey: 'translation', displayName: 'Translation', description: 'Translation and localization workflows', isActive: true },
  { taskKey: 'code_generation', displayName: 'Code Generation', description: 'Developer assistant and coding workflows', isActive: true },
] as const;

@Injectable()
export class GatewayControlService {
  private modelCredsCache: { value: Record<string, any>; expiresAt: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getControlProfile() {
    const map = await this.getConfigMap();
    return {
      mode: (map[KEYS.mode] as ControlMode) ?? 'BALANCED',
      dynamicEnabled: map[KEYS.dynamic] !== 'false',
      weights: {
        cost: this.asNumber(map[KEYS.costWeight], 0.34),
        quality: this.asNumber(map[KEYS.qualityWeight], 0.33),
        speed: this.asNumber(map[KEYS.speedWeight], 0.33),
      },
      cheapProviders: this.asProviderList(map[KEYS.cheapProviders], [
        GatewayProvider.OPENAI,
        GatewayProvider.LOCAL,
      ]),
      premiumProviders: this.asProviderList(map[KEYS.premiumProviders], [
        GatewayProvider.CLAUDE,
        GatewayProvider.OPENAI,
      ]),
    };
  }

  async updateControlProfile(input: {
    mode?: ControlMode;
    dynamicEnabled?: boolean;
    costWeight?: number;
    qualityWeight?: number;
    speedWeight?: number;
    cheapProviders?: GatewayProvider[];
    premiumProviders?: GatewayProvider[];
  }) {
    const ops: Promise<any>[] = [];
    if (input.mode) ops.push(this.upsert(KEYS.mode, input.mode));
    if (input.dynamicEnabled !== undefined) ops.push(this.upsert(KEYS.dynamic, String(input.dynamicEnabled)));
    if (input.costWeight !== undefined) ops.push(this.upsert(KEYS.costWeight, String(input.costWeight)));
    if (input.qualityWeight !== undefined) ops.push(this.upsert(KEYS.qualityWeight, String(input.qualityWeight)));
    if (input.speedWeight !== undefined) ops.push(this.upsert(KEYS.speedWeight, String(input.speedWeight)));
    if (input.cheapProviders) ops.push(this.upsert(KEYS.cheapProviders, JSON.stringify(input.cheapProviders)));
    if (input.premiumProviders) ops.push(this.upsert(KEYS.premiumProviders, JSON.stringify(input.premiumProviders)));
    await Promise.all(ops);
    return this.getControlProfile();
  }

  async getFeatureToggles() {
    const rows = await this.prisma.billingConfig.findMany({
      where: { key: { startsWith: 'AI_FEATURE_TOGGLE_' } },
      orderBy: { key: 'asc' },
    });
    return rows.map((r) => ({
      key: r.key.replace('AI_FEATURE_TOGGLE_', ''),
      enabled: r.value === 'true',
    }));
  }

  async setFeatureToggle(featureKey: string, enabled: boolean) {
    await this.upsert(`AI_FEATURE_TOGGLE_${featureKey.toUpperCase()}`, String(enabled));
    return { featureKey: featureKey.toUpperCase(), enabled };
  }

  async isFeatureEnabled(featureKey: string) {
    const row = await this.prisma.billingConfig.findUnique({
      where: { key: `AI_FEATURE_TOGGLE_${featureKey.toUpperCase()}` },
    });
    return row ? row.value === 'true' : true;
  }

  async getUsageLimits() {
    const row = await this.prisma.billingConfig.findUnique({ where: { key: KEYS.usageLimits } });
    if (!row) {
      return {
        maxTokensPerRequest: 16000,
        maxBatchRequests: 10,
        maxFailoverModels: 3,
      };
    }
    try {
      return JSON.parse(row.value);
    } catch {
      return {
        maxTokensPerRequest: 16000,
        maxBatchRequests: 10,
        maxFailoverModels: 3,
      };
    }
  }

  async setUsageLimits(input: {
    maxTokensPerRequest?: number;
    maxBatchRequests?: number;
    maxFailoverModels?: number;
  }) {
    const current = await this.getUsageLimits();
    const next = {
      ...current,
      ...input,
    };
    await this.upsert(KEYS.usageLimits, JSON.stringify(next));
    return next;
  }

  async getFeatureModelLimits() {
    const row = await this.prisma.billingConfig.findUnique({ where: { key: KEYS.modelLimits } });
    if (!row) return {};
    try {
      return JSON.parse(row.value);
    } catch {
      return {};
    }
  }

  async setFeatureModelLimit(feature: string, modelIds: string[]) {
    const normalizedModelIds = await this.ensureModelIdsExist(modelIds);
    const current = await this.getFeatureModelLimits();
    current[feature] = normalizedModelIds;
    await this.upsert(KEYS.modelLimits, JSON.stringify(current));
    await this.writeAuditEvent('set_feature_model_limit', {
      feature,
      modelIds: normalizedModelIds,
    });
    return { feature, modelIds: normalizedModelIds };
  }

  async getTenantUsageLimits() {
    const row = await this.prisma.billingConfig.findUnique({ where: { key: KEYS.tenantUsageLimits } });
    if (!row) return {};
    try {
      return JSON.parse(row.value);
    } catch {
      return {};
    }
  }

  async setTenantUsageLimit(
    organizationId: string,
    input: {
      maxTokensPerRequest?: number;
      maxBatchRequests?: number;
      maxFailoverModels?: number;
    },
  ) {
    const current = await this.getTenantUsageLimits();
    current[organizationId] = {
      ...(current[organizationId] ?? {}),
      ...input,
    };
    await this.upsert(KEYS.tenantUsageLimits, JSON.stringify(current));
    return { organizationId, limits: current[organizationId] };
  }

  async getTenantFeatureModelLimits() {
    const row = await this.prisma.billingConfig.findUnique({ where: { key: KEYS.tenantModelLimits } });
    if (!row) return {};
    try {
      return JSON.parse(row.value);
    } catch {
      return {};
    }
  }

  async setTenantFeatureModelLimit(organizationId: string, feature: string, modelIds: string[]) {
    const normalizedModelIds = await this.ensureModelIdsExist(modelIds);
    const current = await this.getTenantFeatureModelLimits();
    current[organizationId] = current[organizationId] ?? {};
    current[organizationId][feature] = normalizedModelIds;
    await this.upsert(KEYS.tenantModelLimits, JSON.stringify(current));
    await this.writeAuditEvent('set_tenant_feature_model_limit', {
      organizationId,
      feature,
      modelIds: normalizedModelIds,
    });
    return { organizationId, feature, modelIds: normalizedModelIds };
  }

  async getTaskCatalog() {
    try {
      const rows = await this.prisma.$queryRawUnsafe<Array<{
        id: string;
        taskKey: string;
        displayName: string;
        description: string;
        isActive: boolean;
      }>>(
        `SELECT "id","taskKey","displayName","description","isActive"
         FROM "AITask"
         ORDER BY "taskKey" ASC`,
      );
      if (rows.length > 0) return rows;
    } catch {
      // fallback to config/default if migration not applied yet
    }
    const row = await this.prisma.billingConfig.findUnique({ where: { key: KEYS.taskCatalog } });
    if (!row) return [...DEFAULT_TASK_CATALOG];
    try {
      const parsed = JSON.parse(row.value);
      return Array.isArray(parsed) ? parsed : [...DEFAULT_TASK_CATALOG];
    } catch {
      return [...DEFAULT_TASK_CATALOG];
    }
  }

  async upsertTaskCatalogEntry(input: {
    taskKey: string;
    displayName: string;
    description?: string;
    isActive?: boolean;
  }) {
    const normalizedKey = String(input.taskKey || '').trim().toLowerCase();
    if (!normalizedKey) {
      throw new BadRequestException('taskKey is required');
    }
    const next = {
      taskKey: normalizedKey,
      displayName: input.displayName,
      description: input.description ?? '',
      isActive: input.isActive ?? true,
      updatedAt: new Date().toISOString(),
    };
    try {
      await this.prisma.$executeRawUnsafe(
        `
          INSERT INTO "AITask" ("id","taskKey","displayName","description","isActive","createdAt","updatedAt")
          VALUES (md5(random()::text || clock_timestamp()::text), $1, $2, $3, $4, NOW(), NOW())
          ON CONFLICT ("taskKey")
          DO UPDATE SET
            "displayName" = EXCLUDED."displayName",
            "description" = EXCLUDED."description",
            "isActive" = EXCLUDED."isActive",
            "updatedAt" = NOW()
        `,
        normalizedKey,
        next.displayName,
        next.description,
        next.isActive,
      );
    } catch {
      const current = await this.getTaskCatalog();
      const idx = current.findIndex((t: any) => t.taskKey === normalizedKey);
      if (idx >= 0) current[idx] = { ...current[idx], ...next };
      else current.push(next);
      await this.upsert(KEYS.taskCatalog, JSON.stringify(current));
    }
    await this.writeAuditEvent('upsert_task_catalog_entry', next);
    return next;
  }

  async deleteTaskCatalogEntry(taskKey: string) {
    const normalized = String(taskKey || '').trim().toLowerCase();
    if (!normalized) throw new BadRequestException('taskKey is required');
    try {
      await this.prisma.$executeRawUnsafe(`DELETE FROM "AITask" WHERE "taskKey" = $1`, normalized);
    } catch {
      const current = await this.getTaskCatalog();
      const next = current.filter((t: any) => t.taskKey !== normalized);
      await this.upsert(KEYS.taskCatalog, JSON.stringify(next));
    }
    await this.writeAuditEvent('delete_task_catalog_entry', { taskKey: normalized });
    return { deleted: true, taskKey: normalized };
  }

  async getTaskRouteMap() {
    try {
      const rows = await this.prisma.$queryRawUnsafe<Array<{
        taskKey: string;
        primaryModelId: string;
        fallbackModelIds: string[] | null;
        strategy: string;
        maxCostUsdPerRequest: number | null;
        maxLatencyMs: number | null;
        isActive: boolean;
      }>>(
        `SELECT "taskKey","primaryModelId","fallbackModelIds","strategy","maxCostUsdPerRequest","maxLatencyMs","isActive"
         FROM "AIRoutingRule"
         ORDER BY "taskKey" ASC`,
      );
      if (rows.length > 0) {
        return Object.fromEntries(
          rows.map((r) => [
            r.taskKey,
            {
              primaryModelId: r.primaryModelId,
              fallbackModelIds: r.fallbackModelIds ?? [],
              strategy: r.strategy,
              maxCostUsdPerRequest: r.maxCostUsdPerRequest,
              maxLatencyMs: r.maxLatencyMs,
              isActive: r.isActive,
            },
          ]),
        );
      }
    } catch {
      // fallback to config
    }
    const row = await this.prisma.billingConfig.findUnique({ where: { key: KEYS.taskRouteMap } });
    if (!row) return {};
    try {
      return JSON.parse(row.value);
    } catch {
      return {};
    }
  }

  async setTaskRoute(
    task: string,
    input: {
      primaryModelId: string;
      fallbackModelIds?: string[];
      strategy?: 'cheapest' | 'fastest' | 'best_quality' | 'balanced' | 'custom';
      maxCostUsdPerRequest?: number;
      maxLatencyMs?: number;
      isActive?: boolean;
    },
  ) {
    const resolvedPrimary = await this.ensureModelIdsExist([input.primaryModelId]);
    const resolvedFallback = await this.ensureModelIdsExist(input.fallbackModelIds ?? []);
    const map = await this.getTaskRouteMap();
    map[task] = {
      primaryModelId: resolvedPrimary[0],
      fallbackModelIds: resolvedFallback,
      strategy: input.strategy ?? 'balanced',
      maxCostUsdPerRequest: input.maxCostUsdPerRequest ?? null,
      maxLatencyMs: input.maxLatencyMs ?? null,
      isActive: input.isActive ?? true,
      updatedAt: new Date().toISOString(),
    };
    try {
      await this.prisma.$executeRawUnsafe(
        `
          INSERT INTO "AIRoutingRule"
          ("id","taskKey","primaryModelId","fallbackModelIds","strategy","maxCostUsdPerRequest","maxLatencyMs","isActive","createdAt","updatedAt")
          VALUES (md5(random()::text || clock_timestamp()::text), $1, $2, $3::text[], $4, $5, $6, $7, NOW(), NOW())
          ON CONFLICT ("taskKey")
          DO UPDATE SET
            "primaryModelId" = EXCLUDED."primaryModelId",
            "fallbackModelIds" = EXCLUDED."fallbackModelIds",
            "strategy" = EXCLUDED."strategy",
            "maxCostUsdPerRequest" = EXCLUDED."maxCostUsdPerRequest",
            "maxLatencyMs" = EXCLUDED."maxLatencyMs",
            "isActive" = EXCLUDED."isActive",
            "updatedAt" = NOW()
        `,
        task,
        map[task].primaryModelId,
        map[task].fallbackModelIds ?? [],
        map[task].strategy ?? 'balanced',
        map[task].maxCostUsdPerRequest ?? null,
        map[task].maxLatencyMs ?? null,
        map[task].isActive ?? true,
      );
    } catch {
      await this.upsert(KEYS.taskRouteMap, JSON.stringify(map));
    }
    await this.writeAuditEvent('set_task_route', {
      task,
      ...map[task],
    });
    return { task, ...map[task] };
  }

  async deleteTaskRoute(task: string) {
    const key = String(task || '').trim();
    if (!key) throw new BadRequestException('task is required');
    try {
      await this.prisma.$executeRawUnsafe(`DELETE FROM "AIRoutingRule" WHERE "taskKey" = $1`, key);
    } catch {
      const map = await this.getTaskRouteMap();
      delete map[key];
      await this.upsert(KEYS.taskRouteMap, JSON.stringify(map));
    }
    await this.writeAuditEvent('delete_task_route', { task: key });
    return { deleted: true, task: key };
  }

  async getContentTypeProviderModelMap() {
    const row = await this.prisma.billingConfig.findUnique({
      where: { key: KEYS.contentTypeProviderModelMap },
    });
    if (!row) return {};
    try {
      return JSON.parse(row.value);
    } catch {
      return {};
    }
  }

  async setContentTypeProviderModel(
    contentType: 'text' | 'image' | 'video' | 'ugc' | 'audio',
    provider: GatewayProvider,
    modelId: string,
  ) {
    const model = await this.prisma.aIGatewayModel.findFirst({
      where: {
        OR: [{ modelId }, { id: modelId }],
      },
      select: { id: true, modelId: true, provider: true },
    });
    if (!model) throw new BadRequestException(`Unknown model: ${modelId}`);
    if (String(model.provider) !== String(provider)) {
      throw new BadRequestException(
        `Model/provider mismatch. Selected model provider is ${model.provider}, got ${provider}`,
      );
    }

    const current = await this.getContentTypeProviderModelMap();
    current[contentType] = current[contentType] ?? {};
    current[contentType][provider] = model.modelId;
    await this.upsert(KEYS.contentTypeProviderModelMap, JSON.stringify(current));
    await this.writeAuditEvent('set_content_type_provider_model', {
      contentType,
      provider,
      modelId: model.modelId,
    });
    return { contentType, provider, modelId: model.modelId };
  }

  async getModelCredentialsMap() {
    const now = Date.now();
    if (this.modelCredsCache && this.modelCredsCache.expiresAt > now) {
      return this.decryptCredentialMap(this.modelCredsCache.value);
    }
    const raw = await this.getStoredCredentialMap();
    this.modelCredsCache = {
      value: raw,
      expiresAt: now + 30_000,
    };
    return this.decryptCredentialMap(raw);
  }

  private async getStoredCredentialMap() {
    const row = await this.prisma.billingConfig.findUnique({
      where: { key: KEYS.modelCredentialsMap },
    });
    if (!row) return {};
    try {
      return JSON.parse(row.value);
    } catch {
      return {};
    }
  }

  async setModelCredentials(
    modelId: string,
    input: { apiKey?: string; baseUrl?: string; endpoint?: string },
  ) {
    const model = await this.prisma.aIGatewayModel.findFirst({
      where: {
        OR: [{ modelId }, { id: modelId }],
      },
      select: { modelId: true },
    });
    if (!model) throw new BadRequestException(`Unknown model: ${modelId}`);

    const current = await this.getStoredCredentialMap();
    const canonicalModelId = model.modelId;
    const prev = current[canonicalModelId] ?? {};
    current[canonicalModelId] = {
      ...prev,
      ...(input.apiKey !== undefined
        ? { apiKey: input.apiKey ? this.encryptSecret(input.apiKey) : '' }
        : {}),
      ...(input.baseUrl !== undefined ? { baseUrl: input.baseUrl } : {}),
      ...(input.endpoint !== undefined ? { endpoint: input.endpoint } : {}),
      updatedAt: new Date().toISOString(),
    };
    await this.upsert(KEYS.modelCredentialsMap, JSON.stringify(current));
    this.modelCredsCache = null;
    await this.writeAuditEvent('set_model_credentials', {
      modelId: canonicalModelId,
      hasApiKey: input.apiKey !== undefined ? Boolean(input.apiKey) : undefined,
      hasBaseUrl: input.baseUrl !== undefined ? Boolean(input.baseUrl) : undefined,
      hasEndpoint: input.endpoint !== undefined ? Boolean(input.endpoint) : undefined,
    });
    return { modelId: canonicalModelId, ...this.maskCredential(current[canonicalModelId]) };
  }

  async getModelCredentialsMasked() {
    const map = await this.getModelCredentialsMap();
    return Object.fromEntries(
      Object.entries(map).map(([key, value]) => [key, this.maskCredential(value)]),
    );
  }

  private maskCredential(value: any) {
    const decrypted = value?.apiKey ? this.decryptSecret(String(value.apiKey)) : '';
    const key = decrypted ?? '';
    return {
      hasApiKey: Boolean(key),
      apiKeyPreview: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : '',
      baseUrl: value?.baseUrl ?? '',
      endpoint: value?.endpoint ?? '',
      updatedAt: value?.updatedAt,
    };
  }

  private decryptCredentialMap(map: Record<string, any>) {
    const next: Record<string, any> = {};
    for (const [key, value] of Object.entries(map ?? {})) {
      const apiKey = value?.apiKey ? this.decryptSecret(String(value.apiKey)) : '';
      next[key] = {
        ...value,
        apiKey: apiKey ?? '',
      };
    }
    return next;
  }

  private getEncryptionKey() {
    const source =
      this.config.get<string>('MODEL_CREDENTIAL_ENCRYPTION_KEY') ||
      this.config.get<string>('JWT_SECRET') ||
      'belsuite-dev-key';
    return crypto.createHash('sha256').update(source).digest();
  }

  private encryptSecret(plain: string) {
    if (!plain) return '';
    const iv = crypto.randomBytes(12);
    const key = this.getEncryptionKey();
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `enc:v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  private decryptSecret(encoded: string) {
    if (!encoded) return '';
    if (!encoded.startsWith('enc:v1:')) return encoded;
    try {
      const [, , ivB64, tagB64, dataB64] = encoded.split(':');
      const key = this.getEncryptionKey();
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
      decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(dataB64, 'base64')),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
    } catch {
      return '';
    }
  }

  private async writeAuditEvent(action: string, payload: Record<string, any>) {
    const configuredOrg = this.config.get<string>('ADMIN_AUDIT_ORGANIZATION_ID');
    const organizationId =
      configuredOrg ||
      (await this.prisma.organization.findFirst({ select: { id: true }, orderBy: { createdAt: 'asc' } }))?.id;
    if (!organizationId) return;
    await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        eventType: 'admin.ai_gateway.config_changed',
        properties: JSON.stringify({ action, payload, at: new Date().toISOString() }),
      },
    });
  }

  private async getConfigMap() {
    const rows = await this.prisma.billingConfig.findMany({
      where: {
        key: {
          in: [
            KEYS.mode,
            KEYS.dynamic,
            KEYS.costWeight,
            KEYS.qualityWeight,
            KEYS.speedWeight,
            KEYS.cheapProviders,
            KEYS.premiumProviders,
          ],
        },
      },
    });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  private asNumber(value: string | undefined, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private asProviderList(value: string | undefined, fallback: GatewayProvider[]) {
    if (!value) return fallback;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  private upsert(key: string, value: string) {
    return this.prisma.billingConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  private async ensureModelIdsExist(modelIds: string[]) {
    const unique = Array.from(new Set((modelIds ?? []).filter(Boolean)));
    if (unique.length === 0) return [];
    if (unique.length > 100) {
      throw new BadRequestException('Too many model IDs. Limit is 100.');
    }

    const models = await this.prisma.aIGatewayModel.findMany({
      where: {
        OR: [{ modelId: { in: unique } }, { id: { in: unique } }],
      },
      select: { id: true, modelId: true },
    });
    const resolved = new Map<string, string>();
    for (const m of models) {
      resolved.set(m.id, m.modelId);
      resolved.set(m.modelId, m.modelId);
    }
    const missing = unique.filter((id) => !resolved.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(`Unknown model IDs: ${missing.join(', ')}`);
    }
    return unique.map((id) => resolved.get(id)!).filter(Boolean);
  }
}
