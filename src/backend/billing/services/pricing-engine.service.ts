import { Injectable, Logger } from '@nestjs/common';
import { PrismaService }       from '../../database/prisma.service';
import { UsageFeature }        from '@prisma/client';

// Default exchange rate: 1 USD = 100 credits
const DEFAULT_CREDITS_PER_USD = 100;
// Default margin
const DEFAULT_MARGIN_PCT = 30;

export interface CostInput {
  feature:       UsageFeature;
  model?:        string;
  provider?:     string;
  inputTokens?:  number;
  outputTokens?: number;
  videoMinutes?: number;
  imageCount?:   number;
  smsCount?:     number;
  emailCount?:   number;
  storageGb?:    number;
  apiCalls?:     number;
}

export interface CostResult {
  creditsCharged:  number;
  usdEquivalent:   number;
  providerCostUsd: number;
  marginPct:       number;
  breakdown:       Record<string, number>;  // metric → credits
}

@Injectable()
export class PricingEngineService {
  private readonly logger = new Logger(PricingEngineService.name);
  // In-memory rule cache (refreshed every 60 seconds)
  private rulesCache: Map<string, any> = new Map();
  private cacheExpiry = 0;

  constructor(private readonly prisma: PrismaService) {}

  // ── Core calculation ──────────────────────────────────────────────────────

  async calculate(input: CostInput): Promise<CostResult> {
    const rule = await this.getRule(input.feature, input.model, input.provider);
    const rate  = await this.getGlobalRate();

    const creditsPerUsd  = rule?.creditsPerUsd ?? rate;
    const marginPct      = rule?.marginPct     ?? DEFAULT_MARGIN_PCT;
    const marginFixed    = rule?.marginFixed   ?? 0;

    const breakdown: Record<string, number> = {};
    let providerCostUsd = 0;
    let creditsCharged  = 0;

    // Token-based features
    if (input.inputTokens && input.inputTokens > 0) {
      const credits = input.inputTokens * (rule?.creditsPerInputToken ?? 0);
      providerCostUsd += input.inputTokens * (rule?.providerCostPerInputToken ?? 0);
      breakdown['inputTokens'] = credits;
      creditsCharged += credits;
    }
    if (input.outputTokens && input.outputTokens > 0) {
      const credits = input.outputTokens * (rule?.creditsPerOutputToken ?? 0);
      providerCostUsd += input.outputTokens * (rule?.providerCostPerOutputToken ?? 0);
      breakdown['outputTokens'] = credits;
      creditsCharged += credits;
    }

    // Video
    if (input.videoMinutes && input.videoMinutes > 0) {
      const credits = input.videoMinutes * (rule?.creditsPerVideoMinute ?? 0);
      providerCostUsd += input.videoMinutes * (rule?.providerCostPerVideoMinute ?? 0);
      breakdown['videoMinutes'] = credits;
      creditsCharged += credits;
    }

    // Images
    if (input.imageCount && input.imageCount > 0) {
      const credits = input.imageCount * (rule?.creditsPerImage ?? 0);
      providerCostUsd += input.imageCount * (rule?.providerCostPerImage ?? 0);
      breakdown['images'] = credits;
      creditsCharged += credits;
    }

    // SMS
    if (input.smsCount && input.smsCount > 0) {
      const credits = input.smsCount * (rule?.creditsPerSms ?? 0);
      breakdown['sms'] = credits;
      creditsCharged += credits;
    }

    // Email
    if (input.emailCount && input.emailCount > 0) {
      const credits = input.emailCount * (rule?.creditsPerEmail ?? 0);
      breakdown['emails'] = credits;
      creditsCharged += credits;
    }

    // Storage (per GB-day)
    if (input.storageGb && input.storageGb > 0) {
      const credits = input.storageGb * (rule?.creditsPerStorageGbDay ?? 0);
      breakdown['storage'] = credits;
      creditsCharged += credits;
    }

    // API calls
    if (input.apiCalls && input.apiCalls > 0 && !input.inputTokens) {
      const credits = input.apiCalls * (rule?.creditsPerApiCall ?? 0);
      breakdown['apiCalls'] = credits;
      creditsCharged += credits;
    }

    // Apply margin
    const marginMultiplier = 1 + (marginPct / 100);
    creditsCharged = creditsCharged * marginMultiplier;

    // Add fixed margin in credits
    if (marginFixed > 0) {
      creditsCharged += marginFixed * creditsPerUsd;
    }

    const usdEquivalent = creditsCharged / creditsPerUsd;

    return {
      creditsCharged:  Math.round(creditsCharged * 10000) / 10000, // 4dp precision
      usdEquivalent:   Math.round(usdEquivalent * 100000) / 100000,
      providerCostUsd: Math.round(providerCostUsd * 100000) / 100000,
      marginPct,
      breakdown,
    };
  }

  // ── Rule management ───────────────────────────────────────────────────────

  async upsertRule(data: {
    feature:          UsageFeature;
    model?:           string;
    provider?:        string;
    creditsPerInputToken?:      number;
    creditsPerOutputToken?:     number;
    creditsPerVideoMinute?:     number;
    creditsPerImage?:           number;
    creditsPerSms?:             number;
    creditsPerEmail?:           number;
    creditsPerStorageGbDay?:    number;
    creditsPerApiCall?:         number;
    providerCostPerInputToken?:  number;
    providerCostPerOutputToken?: number;
    providerCostPerVideoMinute?: number;
    providerCostPerImage?:       number;
    marginPct?:       number;
    marginFixed?:     number;
    creditsPerUsd?:   number;
    isActive?:        boolean;
    note?:            string;
  }) {
    this.invalidateCache();
    return this.prisma.pricingRule.upsert({
      where: {
        feature_model_provider: {
          feature:  data.feature,
          model:    data.model    ?? null as any,
          provider: data.provider ?? null as any,
        },
      },
      update: { ...data, updatedAt: new Date() },
      create: { ...data },
    });
  }

  async listRules() {
    return this.prisma.pricingRule.findMany({ orderBy: [{ feature: 'asc' }, { model: 'asc' }] });
  }

  async deleteRule(id: string) {
    this.invalidateCache();
    return this.prisma.pricingRule.delete({ where: { id } });
  }

  // ── Global config (credits per USD rate) ─────────────────────────────────

  async setGlobalRate(creditsPerUsd: number): Promise<void> {
    await this.prisma.billingConfig.upsert({
      where:  { key: 'CREDITS_PER_USD' },
      update: { value: String(creditsPerUsd) },
      create: { key: 'CREDITS_PER_USD', value: String(creditsPerUsd), description: 'How many credits equal 1 USD' },
    });
    this.invalidateCache();
  }

  async getGlobalRate(): Promise<number> {
    const cfg = await this.prisma.billingConfig.findUnique({ where: { key: 'CREDITS_PER_USD' } });
    return cfg ? parseFloat(cfg.value) : DEFAULT_CREDITS_PER_USD;
  }

  async setDefaultMargin(pct: number): Promise<void> {
    await this.prisma.billingConfig.upsert({
      where:  { key: 'DEFAULT_MARGIN_PCT' },
      update: { value: String(pct) },
      create: { key: 'DEFAULT_MARGIN_PCT', value: String(pct), description: 'Default margin percentage for all AI calls' },
    });
    this.invalidateCache();
  }

  async getBillingConfigs(): Promise<Record<string, string>> {
    const rows = await this.prisma.billingConfig.findMany();
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  }

  // ── Cost estimate for a model (admin UI) ──────────────────────────────────

  async estimateModelCost(model: string, inputTokens: number, outputTokens: number) {
    const rule = await this.getRule(UsageFeature.AI_CHAT, model);
    const rate  = await this.getGlobalRate();
    const creditsPerUsd = rule?.creditsPerUsd ?? rate;

    return {
      model,
      inputTokens,
      outputTokens,
      providerCostUsd:  (inputTokens * (rule?.providerCostPerInputToken ?? 0)) + (outputTokens * (rule?.providerCostPerOutputToken ?? 0)),
      creditsCharged:   (inputTokens * (rule?.creditsPerInputToken ?? 0) + outputTokens * (rule?.creditsPerOutputToken ?? 0)) * (1 + ((rule?.marginPct ?? DEFAULT_MARGIN_PCT) / 100)),
      marginPct:        rule?.marginPct ?? DEFAULT_MARGIN_PCT,
      creditsPerUsd,
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async getRule(feature: UsageFeature, model?: string, provider?: string) {
    const now = Date.now();
    if (now > this.cacheExpiry) await this.loadCache();

    // Precedence: feature+model+provider > feature+model > feature only > null
    const keys = [
      `${feature}:${model}:${provider}`,
      `${feature}:${model}:`,
      `${feature}::`,
    ];
    for (const key of keys) {
      if (this.rulesCache.has(key)) return this.rulesCache.get(key);
    }
    return null;
  }

  private async loadCache() {
    const rules = await this.prisma.pricingRule.findMany({ where: { isActive: true } });
    this.rulesCache.clear();
    for (const rule of rules) {
      const key = `${rule.feature}:${rule.model ?? ''}:${rule.provider ?? ''}`;
      this.rulesCache.set(key, rule);
    }
    this.cacheExpiry = Date.now() + 60_000; // 1 min TTL
  }

  private invalidateCache() {
    this.cacheExpiry = 0;
  }
}
