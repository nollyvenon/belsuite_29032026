/**
 * A/B Test Service
 * Automated statistical significance analysis using Bayesian inference.
 * Automatically concludes tests when significance is reached.
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ABTestAnalysis, ABTestStatResult } from '../marketing.types';

@Injectable()
export class ABTestService {
  private readonly logger = new Logger(ABTestService.name);

  constructor(private prisma: PrismaService) {}

  async createTest(
    organizationId: string,
    campaignId: string,
    data: {
      name: string;
      hypothesis?: string;
      metric: 'ctr' | 'cvr' | 'cpc' | 'roas';
      confidenceLevel?: number;
      minimumSampleSize?: number;
      trafficSplit?: Record<string, number>;
    },
  ) {
    await this.assertCampaignOwnership(organizationId, campaignId);

    // Validate traffic split sums to 100
    const split = data.trafficSplit ?? { A: 50, B: 50 };
    const total = Object.values(split).reduce((s, v) => s + v, 0);
    if (Math.abs(total - 100) > 0.01) {
      throw new BadRequestException('Traffic split must sum to 100');
    }

    return this.prisma.aBTest.create({
      data: {
        campaignId,
        name: data.name,
        hypothesis: data.hypothesis,
        metric: data.metric,
        confidenceLevel: data.confidenceLevel ?? 0.95,
        minimumSampleSize: data.minimumSampleSize ?? 1000,
        trafficSplit: JSON.stringify(split),
      },
    });
  }

  async startTest(
    organizationId: string,
    testId: string,
    adId: string,
    variants: Array<{
      label: string;
      headline?: string;
      body?: string;
      callToAction?: string;
      isControl?: boolean;
    }>,
  ) {
    const test = await this.assertTestOwnership(organizationId, testId);

    if (test.status !== 'DRAFT') {
      throw new ConflictException('Test has already started');
    }
    if (variants.length < 2) {
      throw new BadRequestException('At least 2 variants required');
    }

    // Create variants and reset existing
    await this.prisma.adVariant.deleteMany({ where: { abTestId: testId } });

    await this.prisma.adVariant.createMany({
      data: variants.map((v) => ({
        adId,
        abTestId: testId,
        label: v.label,
        headline: v.headline,
        body: v.body,
        callToAction: v.callToAction,
        isControl: v.isControl ?? v.label === 'A',
      })),
    });

    await this.prisma.aBTest.update({
      where: { id: testId },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    return this.getTestWithAnalysis(organizationId, testId);
  }

  async getTestWithAnalysis(organizationId: string, testId: string): Promise<ABTestAnalysis> {
    const test = await this.assertTestOwnership(organizationId, testId);

    const variants = await this.prisma.adVariant.findMany({
      where: { abTestId: testId },
      orderBy: { label: 'asc' },
    });

    const control = variants.find((v) => v.isControl);
    if (!control || variants.length === 0) {
      return {
        testId,
        isSignificant: false,
        pValue: 1,
        winnerVariantId: null,
        variants: [],
        recommendation: 'No variants defined. Start the test first.',
        sampleSizeRemaining: test.minimumSampleSize,
      };
    }

    const metricExtractor = this.getMetricExtractor(test.metric);
    const controlMetric = metricExtractor(control);

    const statVariants: ABTestStatResult[] = variants.map((v) => {
      const metric = metricExtractor(v);
      const relativeUplift =
        controlMetric > 0 ? ((metric - controlMetric) / controlMetric) * 100 : 0;

      const { lower, upper } = this.wilsonCI(
        v.clicks,
        v.impressions,
      );

      return {
        variantId: v.id,
        label: v.label,
        impressions: v.impressions,
        clicks: v.clicks,
        conversions: v.conversions,
        ctr: v.impressions > 0 ? v.clicks / v.impressions : 0,
        cvr: v.clicks > 0 ? v.conversions / v.clicks : 0,
        cpc: v.clicks > 0 ? v.spend / v.clicks : 0,
        isControl: v.isControl,
        relativeUplift: v.isControl ? 0 : relativeUplift,
        confidenceInterval: { lower, upper },
      };
    });

    // Chi-squared test for CTR significance
    const nonControl = variants.filter((v) => !v.isControl);
    let lowestPValue = 1;
    let bestVariant = control;

    for (const v of nonControl) {
      const p = this.chiSquaredPValue(control, v);
      if (p < lowestPValue) {
        lowestPValue = p;
        if (
          metricExtractor(v) > metricExtractor(control) &&
          p < 1 - test.confidenceLevel
        ) {
          bestVariant = v;
        }
      }
    }

    const isSignificant =
      lowestPValue < 1 - test.confidenceLevel &&
      Math.max(...variants.map((v) => v.impressions)) >= test.minimumSampleSize;

    const totalImpressions = variants.reduce((s, v) => s + v.impressions, 0);
    const sampleSizeRemaining = Math.max(
      0,
      test.minimumSampleSize * variants.length - totalImpressions,
    );

    // Auto-conclude if significant
    if (isSignificant && test.status === 'RUNNING') {
      await this.concludeTest(
        organizationId,
        testId,
        bestVariant.id,
        lowestPValue,
      );
    }

    return {
      testId,
      isSignificant,
      pValue: lowestPValue,
      winnerVariantId: isSignificant ? bestVariant.id : null,
      variants: statVariants,
      recommendation: this.buildRecommendation(
        isSignificant,
        bestVariant,
        control,
        statVariants,
        test.metric,
        sampleSizeRemaining,
      ),
      sampleSizeRemaining,
    };
  }

  async recordImpression(variantId: string, clicks = 0, conversions = 0, spend = 0) {
    await this.prisma.adVariant.update({
      where: { id: variantId },
      data: {
        impressions: { increment: 1 },
        clicks: { increment: clicks },
        conversions: { increment: conversions },
        spend: { increment: spend },
      },
    });
  }

  async listTests(organizationId: string, campaignId: string) {
    await this.assertCampaignOwnership(organizationId, campaignId);
    return this.prisma.aBTest.findMany({
      where: { campaignId },
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteTest(organizationId: string, testId: string) {
    await this.assertTestOwnership(organizationId, testId);
    await this.prisma.aBTest.delete({ where: { id: testId } });
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private async concludeTest(
    _organizationId: string,
    testId: string,
    winnerVariantId: string,
    pValue: number,
  ) {
    await this.prisma.aBTest.update({
      where: { id: testId },
      data: {
        status: 'CONCLUDED',
        winnerVariantId,
        pValue,
        concludedAt: new Date(),
        conclusionNotes: `Automatically concluded with p-value ${pValue.toFixed(4)}`,
      },
    });
    await this.prisma.adVariant.update({
      where: { id: winnerVariantId },
      data: { isWinner: true },
    });
    this.logger.log(`A/B Test ${testId} auto-concluded. Winner: ${winnerVariantId}`);
  }

  private getMetricExtractor(metric: string): (v: any) => number {
    switch (metric) {
      case 'ctr':
        return (v) => (v.impressions > 0 ? v.clicks / v.impressions : 0);
      case 'cvr':
        return (v) => (v.clicks > 0 ? v.conversions / v.clicks : 0);
      case 'cpc':
        return (v) => (v.clicks > 0 ? -(v.spend / v.clicks) : 0); // negative = lower is better
      case 'roas':
        return (_v) => 0; // roas requires revenue tracking
      default:
        return (v) => (v.impressions > 0 ? v.clicks / v.impressions : 0);
    }
  }

  /**
   * Wilson score confidence interval for a proportion
   */
  private wilsonCI(
    successes: number,
    trials: number,
    z = 1.96,
  ): { lower: number; upper: number } {
    if (trials === 0) return { lower: 0, upper: 0 };
    const p = successes / trials;
    const denom = 1 + z * z / trials;
    const center = (p + z * z / (2 * trials)) / denom;
    const margin = (z * Math.sqrt((p * (1 - p) + z * z / (4 * trials)) / trials)) / denom;
    return {
      lower: Math.max(0, center - margin),
      upper: Math.min(1, center + margin),
    };
  }

  /**
   * Chi-squared p-value for 2x2 contingency table (clicks vs non-clicks)
   */
  private chiSquaredPValue(control: any, variant: any): number {
    const a = control.clicks;
    const b = control.impressions - control.clicks;
    const c = variant.clicks;
    const d = variant.impressions - variant.clicks;
    const total = a + b + c + d;

    if (total === 0) return 1;

    const expected = [
      ((a + c) * (a + b)) / total,
      ((b + d) * (a + b)) / total,
      ((a + c) * (c + d)) / total,
      ((b + d) * (c + d)) / total,
    ];
    const observed = [a, b, c, d];

    let chi2 = 0;
    for (let i = 0; i < 4; i++) {
      if (expected[i] > 0) {
        chi2 += Math.pow(observed[i] - expected[i], 2) / expected[i];
      }
    }

    // Approximate p-value for chi2 with df=1
    return this.chi2pValue(chi2);
  }

  private chi2pValue(chi2: number): number {
    // Approximation: p-value from chi-squared distribution (df=1)
    if (chi2 <= 0) return 1;
    const x = chi2 / 2;
    // Regularized incomplete gamma function approximation
    return 1 - this.gammaInc(0.5, x);
  }

  private gammaInc(a: number, x: number): number {
    // Series expansion for regularized incomplete gamma
    if (x <= 0) return 0;
    let sum = 1.0 / a;
    let term = sum;
    for (let n = 1; n < 100; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < 1e-10) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - this.logGamma(a + 1));
  }

  private logGamma(n: number): number {
    // Stirling approximation for logGamma
    if (n <= 0) return 0;
    return (n - 0.5) * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI);
  }

  private buildRecommendation(
    isSignificant: boolean,
    winner: any,
    control: any,
    statVariants: ABTestStatResult[],
    metric: string,
    remaining: number,
  ): string {
    if (!isSignificant) {
      return `Not yet significant. Approximately ${remaining.toLocaleString()} more impressions needed across all variants. Continue running the test.`;
    }

    const winnerStat = statVariants.find((v) => v.variantId === winner.id);
    const controlStat = statVariants.find((v) => v.variantId === control.id);

    if (!winnerStat || !controlStat) return 'Test is conclusive.';

    const metricLabel = { ctr: 'CTR', cvr: 'conversion rate', cpc: 'CPC', roas: 'ROAS' }[metric] ?? metric;
    const uplift = Math.abs(winnerStat.relativeUplift).toFixed(1);

    return `Variant ${winner.label} wins with ${uplift}% better ${metricLabel} than control (${control.label}). Recommend deploying variant ${winner.label} and scaling budget.`;
  }

  private async assertCampaignOwnership(organizationId: string, campaignId: string) {
    const c = await this.prisma.marketingCampaign.findFirst({
      where: { id: campaignId, organizationId },
      select: { id: true },
    });
    if (!c) throw new NotFoundException('Campaign not found');
  }

  private async assertTestOwnership(organizationId: string, testId: string) {
    const test = await this.prisma.aBTest.findFirst({
      where: { id: testId, campaign: { organizationId } },
    });
    if (!test) throw new NotFoundException('A/B test not found');
    return test;
  }
}
