import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CampaignChannelRoute,
  UpsertCampaignChannelRouteDto,
} from '../dtos/campaign-channel-settings.dto';

type Store = {
  routes: CampaignChannelRoute[];
  updatedAt: string;
};

@Injectable()
export class AdminCampaignChannelSettingsService {
  private readonly keyPrefix = 'campaign_channel_routes:';

  constructor(private readonly prisma: PrismaService) {}

  async getRoutes(organizationId: string): Promise<CampaignChannelRoute[]> {
    const row = await this.prisma.billingConfig.findUnique({
      where: { key: `${this.keyPrefix}${organizationId}` },
    });
    if (!row) {
      return [
        { objective: 'awareness', channel: 'email', provider: 'sendgrid' },
        { objective: 'engagement', channel: 'email', provider: 'sendgrid' },
        { objective: 'conversion', channel: 'sms', provider: 'TWILIO' },
        { objective: 'retention', channel: 'email', provider: 'sendgrid' },
      ];
    }
    const data = JSON.parse(row.value) as Store;
    return data.routes ?? [];
  }

  async upsertRoute(organizationId: string, dto: UpsertCampaignChannelRouteDto) {
    const routes = await this.getRoutes(organizationId);
    const idx = routes.findIndex((r) => r.objective === dto.objective);
    const nextRoute: CampaignChannelRoute = {
      objective: dto.objective,
      channel: dto.channel,
      provider: dto.provider,
    };
    if (idx >= 0) routes[idx] = nextRoute;
    else routes.push(nextRoute);
    await this.persist(organizationId, routes);
    return nextRoute;
  }

  async deleteRoute(organizationId: string, objective: string) {
    const routes = await this.getRoutes(organizationId);
    const next = routes.filter((r) => r.objective !== objective);
    await this.persist(organizationId, next);
    return { deleted: true, objective };
  }

  private async persist(organizationId: string, routes: CampaignChannelRoute[]) {
    const store: Store = { routes, updatedAt: new Date().toISOString() };
    await this.prisma.billingConfig.upsert({
      where: { key: `${this.keyPrefix}${organizationId}` },
      create: {
        key: `${this.keyPrefix}${organizationId}`,
        value: JSON.stringify(store),
        description: 'Campaign objective to channel/provider route map',
      },
      update: { value: JSON.stringify(store) },
    });
  }
}
