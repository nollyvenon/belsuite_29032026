/**
 * Google Ads Platform Service
 * Manages OAuth2, campaign sync, and metric pulling via
 * the Google Ads API v14.
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { PerformanceTrackingService } from '../performance-tracking.service';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_ADS_API = 'https://googleads.googleapis.com/v14';

@Injectable()
export class GoogleAdsService {
  private readonly logger = new Logger(GoogleAdsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private tracking: PerformanceTrackingService,
  ) {}

  /**
   * OAuth: Generate Google Ads authorization URL
   */
  getOAuthUrl(organizationId: string, redirectUri: string): string {
    const clientId = this.config.get<string>('GOOGLE_ADS_CLIENT_ID') ?? '';
    const scopes = ['https://www.googleapis.com/auth/adwords'].join(' ');
    const state = Buffer.from(
      JSON.stringify({ organizationId, platform: 'GOOGLE' }),
    ).toString('base64');

    return (
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${state}`
    );
  }

  /**
   * Exchange OAuth code, list accessible customer accounts, and persist
   */
  async handleOAuthCallback(
    organizationId: string,
    code: string,
    redirectUri: string,
  ) {
    const clientId = this.config.get<string>('GOOGLE_ADS_CLIENT_ID') ?? '';
    const clientSecret = this.config.get<string>('GOOGLE_ADS_CLIENT_SECRET') ?? '';

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      throw new BadRequestException(`Google OAuth error: ${err}`);
    }

    const tokenData = await tokenRes.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    // List accessible customer accounts
    const customersRes = await fetch(
      `${GOOGLE_ADS_API}/customers:listAccessibleCustomers`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'developer-token': this.config.get<string>('GOOGLE_ADS_DEV_TOKEN') ?? '',
        },
      },
    );

    const customersData = await customersRes.json() as { resourceNames?: string[] };
    const customerIds = (customersData.resourceNames ?? []).map((r) =>
      r.replace('customers/', ''),
    );

    const saved = [];
    for (const customerId of customerIds) {
      const info = await this.getCustomerInfo(
        tokenData.access_token,
        customerId,
      );

      const record = await this.prisma.adPlatformAccount.upsert({
        where: {
          organizationId_platform_accountId: {
            organizationId,
            platform: 'GOOGLE_SEARCH',
            accountId: customerId,
          },
        },
        create: {
          organizationId,
          platform: 'GOOGLE_SEARCH',
          accountId: customerId,
          accountName: info.descriptiveName ?? `Google Ads #${customerId}`,
          currencyCode: info.currencyCode ?? 'USD',
          timezone: info.timeZone ?? 'UTC',
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
          isActive: true,
        },
        update: {
          accountName: info.descriptiveName ?? `Google Ads #${customerId}`,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
          isActive: true,
          syncedAt: new Date(),
        },
      });
      saved.push(record);
    }

    return { accounts: saved };
  }

  /**
   * Refresh an expired access token using the stored refresh token
   */
  async refreshAccessToken(adAccountId: string): Promise<string> {
    const account = await this.prisma.adPlatformAccount.findUnique({
      where: { id: adAccountId },
    });

    if (!account?.refreshToken) throw new BadRequestException('No refresh token stored');

    const clientId = this.config.get<string>('GOOGLE_ADS_CLIENT_ID') ?? '';
    const clientSecret = this.config.get<string>('GOOGLE_ADS_CLIENT_SECRET') ?? '';

    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: account.refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }).toString(),
    });

    const data = await res.json() as { access_token: string; expires_in: number };

    await this.prisma.adPlatformAccount.update({
      where: { id: adAccountId },
      data: {
        accessToken: data.access_token,
        tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
      },
    });

    return data.access_token;
  }

  /**
   * Create a Google Ads campaign
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
      throw new BadRequestException('Campaign has no linked Google Ads account');
    }

    const accessToken = await this.getValidToken(campaign.adAccount);

    const body = {
      operations: [
        {
          create: {
            name: campaign.name,
            advertisingChannelType: this.mapChannelType(campaign.adAccount.platform),
            status: 'PAUSED',
            campaignBudget: campaign.dailyBudget
              ? `customers/${campaign.adAccount.accountId}/campaignBudgets/~temp` // simplified
              : undefined,
          },
        },
      ],
    };

    const res = await fetch(
      `${GOOGLE_ADS_API}/customers/${campaign.adAccount.accountId}/campaigns:mutate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'developer-token': this.config.get<string>('GOOGLE_ADS_DEV_TOKEN') ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    const data = await res.json() as { results?: Array<{ resourceName: string }>; error?: any };

    if (data.error) {
      throw new BadRequestException(`Google Ads API: ${JSON.stringify(data.error)}`);
    }

    const resourceName = data.results?.[0]?.resourceName ?? '';
    const platformId = resourceName.split('/campaigns/')[1] ?? '';

    await this.prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: { platformCampaignId: platformId },
    });

    return { platformCampaignId: platformId };
  }

  /**
   * Pull campaign performance using GAQL (Google Ads Query Language)
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
      return { synced: false, message: 'Campaign not synced to Google Ads' };
    }

    const date = dateStr ?? new Date().toISOString().split('T')[0];
    const accessToken = await this.getValidToken(campaign.adAccount);

    const query = `
      SELECT
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.cost_micros,
        metrics.conversions_value
      FROM campaign
      WHERE campaign.id = ${campaign.platformCampaignId}
        AND segments.date = '${date}'
    `;

    const res = await fetch(
      `${GOOGLE_ADS_API}/customers/${campaign.adAccount.accountId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'developer-token': this.config.get<string>('GOOGLE_ADS_DEV_TOKEN') ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      },
    );

    const data = await res.json() as { results?: Array<{ metrics: any }> };

    if (!data.results?.length) {
      return { synced: true, message: 'No data for this date' };
    }

    const m = data.results[0].metrics;
    const spend = (parseInt(m.costMicros ?? '0') / 1_000_000);

    await this.tracking.ingestDailySnapshot(campaignId, new Date(date), {
      impressions: parseInt(m.impressions ?? '0'),
      clicks: parseInt(m.clicks ?? '0'),
      conversions: parseFloat(m.conversions ?? '0'),
      spend,
      revenue: parseFloat(m.conversionsValue ?? '0'),
      platformBreakdown: JSON.stringify({ GOOGLE: m }),
    });

    return { synced: true, date };
  }

  async listAdAccounts(organizationId: string) {
    return this.prisma.adPlatformAccount.findMany({
      where: {
        organizationId,
        platform: { in: ['GOOGLE_SEARCH', 'GOOGLE_DISPLAY', 'GOOGLE_YOUTUBE'] },
      },
      select: {
        id: true,
        accountId: true,
        accountName: true,
        platform: true,
        currencyCode: true,
        isActive: true,
        syncedAt: true,
      },
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async getValidToken(account: {
    id: string;
    accessToken: string;
    tokenExpiresAt: Date | null;
  }): Promise<string> {
    if (account.tokenExpiresAt && account.tokenExpiresAt < new Date()) {
      return this.refreshAccessToken(account.id);
    }
    return account.accessToken;
  }

  private async getCustomerInfo(
    accessToken: string,
    customerId: string,
  ): Promise<{ descriptiveName?: string; currencyCode?: string; timeZone?: string }> {
    try {
      const res = await fetch(
        `${GOOGLE_ADS_API}/customers/${customerId}/googleAds:search`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'developer-token': this.config.get<string>('GOOGLE_ADS_DEV_TOKEN') ?? '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: 'SELECT customer.descriptive_name, customer.currency_code, customer.time_zone FROM customer LIMIT 1',
          }),
        },
      );
      const data = await res.json() as { results?: Array<{ customer: any }> };
      return data.results?.[0]?.customer ?? {};
    } catch {
      return {};
    }
  }

  private mapChannelType(platform: string): string {
    if (platform === 'GOOGLE_DISPLAY') return 'DISPLAY';
    if (platform === 'GOOGLE_YOUTUBE') return 'VIDEO';
    return 'SEARCH';
  }
}
