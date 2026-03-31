/**
 * Facebook Ads Platform Service
 * Manages OAuth, campaign sync, ad creation, and metric pulling via
 * the Facebook Marketing API v18.
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { PerformanceTrackingService } from '../performance-tracking.service';

const FB_API = 'https://graph.facebook.com/v18.0';

@Injectable()
export class FacebookAdsService {
  private readonly logger = new Logger(FacebookAdsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private tracking: PerformanceTrackingService,
  ) {}

  /**
   * OAuth: Generate Facebook Ads authorization URL
   */
  getOAuthUrl(organizationId: string, redirectUri: string): string {
    const appId = this.config.get<string>('FACEBOOK_APP_ID') ?? '';
    const scopes = [
      'ads_management',
      'ads_read',
      'business_management',
      'pages_read_engagement',
    ].join(',');

    const state = Buffer.from(JSON.stringify({ organizationId, platform: 'FACEBOOK' })).toString(
      'base64',
    );

    return (
      `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scopes}&state=${state}&response_type=code`
    );
  }

  /**
   * Exchange OAuth code for access token and save ad account
   */
  async handleOAuthCallback(
    organizationId: string,
    code: string,
    redirectUri: string,
  ) {
    const appId = this.config.get<string>('FACEBOOK_APP_ID') ?? '';
    const appSecret = this.config.get<string>('FACEBOOK_APP_SECRET') ?? '';

    // Exchange code for short-lived token
    const tokenRes = await fetch(
      `${FB_API}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`,
    );
    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      throw new BadRequestException(`Facebook OAuth error: ${err}`);
    }
    const tokenData = await tokenRes.json() as { access_token: string; expires_in: number };

    // Exchange for long-lived token
    const longLivedRes = await fetch(
      `${FB_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}` +
        `&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`,
    );
    const longLivedData = await longLivedRes.json() as { access_token: string; expires_in: number };
    const accessToken = longLivedData.access_token ?? tokenData.access_token;
    const expiresIn = longLivedData.expires_in ?? tokenData.expires_in ?? 5184000;

    // Fetch ad accounts
    const accountsRes = await this.fbGet(
      '/me/adaccounts?fields=account_id,name,currency,timezone_name',
      accessToken,
    );

    const accounts = accountsRes.data ?? [];
    const saved = [];

    for (const account of accounts) {
      const record = await this.prisma.adPlatformAccount.upsert({
        where: {
          organizationId_platform_accountId: {
            organizationId,
            platform: 'FACEBOOK',
            accountId: account.account_id,
          },
        },
        create: {
          organizationId,
          platform: 'FACEBOOK',
          accountId: account.account_id,
          accountName: account.name,
          currencyCode: account.currency ?? 'USD',
          timezone: account.timezone_name ?? 'UTC',
          accessToken,
          tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
          isActive: true,
        },
        update: {
          accountName: account.name,
          accessToken,
          tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
          isActive: true,
          syncedAt: new Date(),
        },
      });
      saved.push(record);
    }

    return { accounts: saved };
  }

  /**
   * Create a campaign on Facebook Ads Manager
   */
  async createPlatformCampaign(
    organizationId: string,
    campaignId: string,
  ): Promise<{ platformCampaignId: string }> {
    const campaign = await this.prisma.marketingCampaign.findFirst({
      where: { id: campaignId, organizationId },
      include: { adAccount: true },
    });

    if (!campaign?.adAccount) {
      throw new BadRequestException(
        'Campaign has no linked Facebook ad account',
      );
    }

    const { accessToken, accountId } = campaign.adAccount;
    const fbObjective = this.mapObjective(campaign.objective);

    const res = await this.fbPost(
      `/act_${accountId}/campaigns`,
      {
        name: campaign.name,
        objective: fbObjective,
        status: 'PAUSED',
        special_ad_categories: [],
      },
      accessToken,
    );

    if (res.error) {
      throw new BadRequestException(`Facebook API: ${res.error.message}`);
    }

    await this.prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: { platformCampaignId: res.id },
    });

    return { platformCampaignId: res.id };
  }

  /**
   * Activate a campaign on Facebook
   */
  async activateCampaign(organizationId: string, campaignId: string) {
    const campaign = await this.prisma.marketingCampaign.findFirst({
      where: { id: campaignId, organizationId },
      include: { adAccount: true },
    });

    if (!campaign?.adAccount || !campaign.platformCampaignId) {
      throw new BadRequestException('Campaign not synced to Facebook');
    }

    await this.fbPost(
      `/${campaign.platformCampaignId}`,
      { status: 'ACTIVE' },
      campaign.adAccount.accessToken,
    );

    await this.prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: { status: 'ACTIVE' },
    });

    return { activated: true };
  }

  /**
   * Pull daily insights from Facebook and persist via performance tracking
   */
  async syncCampaignInsights(
    organizationId: string,
    campaignId: string,
    dateStr?: string,
  ) {
    const campaign = await this.prisma.marketingCampaign.findFirst({
      where: { id: campaignId, organizationId },
      include: { adAccount: true },
    });

    if (!campaign?.adAccount || !campaign.platformCampaignId) {
      return { synced: false, message: 'Campaign not synced to Facebook' };
    }

    const date = dateStr ?? new Date().toISOString().split('T')[0];
    const { accessToken, accountId } = campaign.adAccount;

    const insights = await this.fbGet(
      `/act_${accountId}/insights?fields=impressions,clicks,spend,actions,action_values` +
        `&level=campaign&campaign_id=${campaign.platformCampaignId}` +
        `&time_range={"since":"${date}","until":"${date}"}`,
      accessToken,
    );

    if (!insights.data?.[0]) {
      return { synced: true, message: 'No data for this date' };
    }

    const d = insights.data[0];
    const conversions =
      (d.actions as any[])?.find((a: any) => a.action_type === 'purchase')?.value ?? 0;
    const revenue =
      (d.action_values as any[])?.find((a: any) => a.action_type === 'purchase')?.value ?? 0;

    await this.tracking.ingestDailySnapshot(campaignId, new Date(date), {
      impressions: parseInt(d.impressions ?? '0', 10),
      clicks: parseInt(d.clicks ?? '0', 10),
      conversions: parseInt(String(conversions), 10),
      spend: parseFloat(d.spend ?? '0'),
      revenue: parseFloat(String(revenue)),
      platformBreakdown: JSON.stringify({ FACEBOOK: d }),
    });

    return { synced: true, date };
  }

  /**
   * List all ad accounts connected for this org
   */
  async listAdAccounts(organizationId: string) {
    return this.prisma.adPlatformAccount.findMany({
      where: { organizationId, platform: 'FACEBOOK' },
      select: {
        id: true,
        accountId: true,
        accountName: true,
        currencyCode: true,
        isActive: true,
        syncedAt: true,
      },
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private mapObjective(objective: string): string {
    const map: Record<string, string> = {
      AWARENESS: 'BRAND_AWARENESS',
      TRAFFIC: 'LINK_CLICKS',
      ENGAGEMENT: 'POST_ENGAGEMENT',
      LEADS: 'LEAD_GENERATION',
      CONVERSIONS: 'CONVERSIONS',
      APP_INSTALLS: 'APP_INSTALLS',
      VIDEO_VIEWS: 'VIDEO_VIEWS',
    };
    return map[objective] ?? 'CONVERSIONS';
  }

  private async fbGet(path: string, accessToken: string): Promise<any> {
    const url = path.startsWith('http') ? path : `${FB_API}${path}`;
    const separator = url.includes('?') ? '&' : '?';
    const res = await fetch(`${url}${separator}access_token=${accessToken}`);
    return res.json();
  }

  private async fbPost(path: string, body: object, accessToken: string): Promise<any> {
    const res = await fetch(`${FB_API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, access_token: accessToken }),
    });
    return res.json();
  }
}
