import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GatewayProvider } from '../types/gateway.types';

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
} as const;

@Injectable()
export class GatewayControlService {
  constructor(private readonly prisma: PrismaService) {}

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
    const current = await this.getFeatureModelLimits();
    current[feature] = modelIds;
    await this.upsert(KEYS.modelLimits, JSON.stringify(current));
    return { feature, modelIds };
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
    const current = await this.getTenantFeatureModelLimits();
    current[organizationId] = current[organizationId] ?? {};
    current[organizationId][feature] = modelIds;
    await this.upsert(KEYS.tenantModelLimits, JSON.stringify(current));
    return { organizationId, feature, modelIds };
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
}
