/**
 * Campaign Manager Service
 * Full lifecycle management: create, update, pause, archive, sync to platforms
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RequestContextService } from '../../common/context/request-context.service';
import { EventBus } from '../../common/events/event.bus';
import { AnalyticsEventEmittedEvent } from '../../common/events/event.types';
import { CampaignObjectiveEnum } from '../marketing.types';

export interface CreateCampaignDto {
  name: string;
  description?: string;
  objective: CampaignObjectiveEnum;
  dailyBudget?: number;
  totalBudget?: number;
  startDate?: string;
  endDate?: string;
  adAccountId?: string;
  audienceJson?: string;
}

export interface UpdateCampaignDto {
  name?: string;
  description?: string;
  dailyBudget?: number;
  totalBudget?: number;
  startDate?: string;
  endDate?: string;
  audienceJson?: string;
}

@Injectable()
export class CampaignManagerService {
  private readonly logger = new Logger(CampaignManagerService.name);

  constructor(
    private prisma: PrismaService,
    private readonly contextService: RequestContextService,
    private readonly eventBus: EventBus,
  ) {}

  async listCampaigns(organizationId: string, status?: string) {
    const where: any = { organizationId };
    if (status) where.status = status;

    return this.prisma.marketingCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        adAccount: {
          select: { platform: true, accountName: true, currencyCode: true },
        },
        _count: { select: { ads: true, abTests: true } },
      },
    });
  }

  async getCampaign(organizationId: string, campaignId: string) {
    const campaign = await this.prisma.marketingCampaign.findFirst({
      where: { id: campaignId, organizationId },
      include: {
        adAccount: true,
        ads: {
          include: {
            _count: { select: { variants: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        abTests: { orderBy: { createdAt: 'desc' } },
        performanceSnapshots: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async createCampaign(organizationId: string, dto: CreateCampaignDto) {
    // Verify ad account belongs to org if provided
    if (dto.adAccountId) {
      const account = await this.prisma.adPlatformAccount.findFirst({
        where: { id: dto.adAccountId, organizationId },
      });
      if (!account) throw new BadRequestException('Ad account not found');
    }

    const campaign = await this.prisma.marketingCampaign.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description,
        objective: dto.objective as any,
        adAccountId: dto.adAccountId,
        dailyBudget: dto.dailyBudget,
        totalBudget: dto.totalBudget,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        audienceJson: dto.audienceJson,
        aiGenerated: false,
      },
    });

    await this.publishCampaignEvent(
      organizationId,
      'marketing.campaign.created',
      {
        campaignId: campaign.id,
        objective: campaign.objective,
        status: campaign.status,
      },
    );

    return campaign;
  }

  async updateCampaign(
    organizationId: string,
    campaignId: string,
    dto: UpdateCampaignDto,
  ) {
    await this.assertOwnership(organizationId, campaignId);

    const campaign = await this.prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.dailyBudget !== undefined && { dailyBudget: dto.dailyBudget }),
        ...(dto.totalBudget !== undefined && { totalBudget: dto.totalBudget }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.audienceJson !== undefined && { audienceJson: dto.audienceJson }),
      },
    });

    await this.publishCampaignEvent(
      organizationId,
      'marketing.campaign.updated',
      {
        campaignId: campaign.id,
        status: campaign.status,
      },
    );

    return campaign;
  }

  async setStatus(
    organizationId: string,
    campaignId: string,
    status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED',
  ) {
    await this.assertOwnership(organizationId, campaignId);
    const campaign = await this.prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: { status },
    });

    await this.publishCampaignEvent(
      organizationId,
      'marketing.campaign.status_changed',
      { campaignId, status },
    );

    return campaign;
  }

  async deleteCampaign(organizationId: string, campaignId: string) {
    await this.assertOwnership(organizationId, campaignId);
    await this.prisma.marketingCampaign.delete({ where: { id: campaignId } });
    await this.publishCampaignEvent(
      organizationId,
      'marketing.campaign.deleted',
      { campaignId },
    );
  }

  async cloneCampaign(
    organizationId: string,
    campaignId: string,
    data?: { name?: string; startDate?: string; endDate?: string },
  ) {
    const campaign = await this.prisma.marketingCampaign.findFirst({
      where: { id: campaignId, organizationId },
      include: { ads: true },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');

    const clonedCampaign = await this.prisma.$transaction(async (tx) => {
      const created = await tx.marketingCampaign.create({
        data: {
          organizationId,
          adAccountId: campaign.adAccountId,
          name: data?.name?.trim() || `${campaign.name} Copy`,
          description: campaign.description,
          objective: campaign.objective,
          dailyBudget: campaign.dailyBudget,
          totalBudget: campaign.totalBudget,
          startDate: data?.startDate ? new Date(data.startDate) : campaign.startDate,
          endDate: data?.endDate ? new Date(data.endDate) : campaign.endDate,
          audienceJson: campaign.audienceJson,
          status: 'DRAFT',
          aiGenerated: campaign.aiGenerated,
          aiNotes: campaign.aiNotes,
        },
      });

      for (const ad of campaign.ads) {
        await tx.ad.create({
          data: {
            campaignId: created.id,
            name: ad.name,
            format: ad.format,
            status: 'DRAFT',
            headline: ad.headline,
            body: ad.body,
            callToAction: ad.callToAction,
            destinationUrl: ad.destinationUrl,
            creativeAssets: ad.creativeAssets,
            aiGenerated: ad.aiGenerated,
            aiPrompt: ad.aiPrompt,
            aiScore: ad.aiScore,
          },
        });
      }

      return created;
    });

    await this.publishCampaignEvent(
      organizationId,
      'marketing.campaign.cloned',
      {
        sourceCampaignId: campaignId,
        clonedCampaignId: clonedCampaign.id,
      },
    );

    return this.getCampaign(organizationId, clonedCampaign.id);
  }

  // ─── Ads management ──────────────────────────────────────────────────────────

  async createAd(
    organizationId: string,
    campaignId: string,
    data: {
      name: string;
      format: string;
      headline?: string;
      body?: string;
      callToAction?: string;
      destinationUrl?: string;
      creativeAssets?: string;
    },
  ) {
    await this.assertOwnership(organizationId, campaignId);
    return this.prisma.ad.create({
      data: {
        campaignId,
        name: data.name,
        format: data.format as any,
        headline: data.headline,
        body: data.body,
        callToAction: data.callToAction,
        destinationUrl: data.destinationUrl,
        creativeAssets: data.creativeAssets,
      },
    });
  }

  async updateAdStatus(
    organizationId: string,
    adId: string,
    status: 'ACTIVE' | 'PAUSED' | 'DRAFT',
  ) {
    const ad = await this.prisma.ad.findFirst({
      where: { id: adId, campaign: { organizationId } },
    });
    if (!ad) throw new NotFoundException('Ad not found');
    return this.prisma.ad.update({ where: { id: adId }, data: { status } });
  }

  async deleteAd(organizationId: string, adId: string) {
    const ad = await this.prisma.ad.findFirst({
      where: { id: adId, campaign: { organizationId } },
    });
    if (!ad) throw new NotFoundException('Ad not found');
    await this.prisma.ad.delete({ where: { id: adId } });
  }

  // ─── Platform sync (stub — real sync in platform services) ───────────────────

  async syncCampaignStatus(organizationId: string, campaignId: string) {
    const campaign = await this.getCampaign(organizationId, campaignId);

    if (!campaign.adAccount || !campaign.platformCampaignId) {
      return {
        synced: false,
        message: 'No ad account or platform campaign ID — connect an ad platform first',
      };
    }

    // Platform sync is handled by Facebook/Google services
    return { synced: true, platformCampaignId: campaign.platformCampaignId };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async assertOwnership(organizationId: string, campaignId: string) {
    const campaign = await this.prisma.marketingCampaign.findFirst({
      where: { id: campaignId, organizationId },
      select: { id: true },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
  }

  private async publishCampaignEvent(
    organizationId: string,
    eventName: string,
    properties: Record<string, unknown>,
  ) {
    const correlationId =
      this.contextService.getCorrelationId() ?? `corr-${Date.now()}`;

    await this.eventBus.publish(
      new AnalyticsEventEmittedEvent(
        organizationId,
        eventName,
        organizationId,
        properties,
        correlationId,
        this.contextService.getUserId(),
      ),
    );
  }
}
