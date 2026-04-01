import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CampaignManagerService } from './campaign-manager.service';
import { RequestContextService } from '../../common/context/request-context.service';
import { EventBus } from '../../common/events/event.bus';

describe('CampaignManagerService — cloneCampaign', () => {
  let service: CampaignManagerService;
  let prisma: jest.Mocked<Record<string, any>>;

  const ORG = 'org_1';
  const SRC_ID = 'cmp_src';
  const CLONED_ID = 'cmp_clone';

  const mockAd = {
    id: 'ad_1',
    name: 'Hero Ad',
    format: 'SINGLE_IMAGE',
    status: 'ACTIVE',
    headline: 'Buy now',
    body: 'Great deal',
    callToAction: 'Shop',
    destinationUrl: 'https://example.com',
    creativeAssets: null,
    aiGenerated: false,
    aiPrompt: null,
    aiScore: null,
  };

  const mockCampaign = {
    id: SRC_ID,
    organizationId: ORG,
    name: 'Summer Sale',
    description: 'Best deals',
    objective: 'CONVERSIONS',
    status: 'ACTIVE',
    adAccountId: null,
    dailyBudget: 100,
    totalBudget: 3000,
    spentBudget: 250,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    audienceJson: null,
    aiGenerated: false,
    aiNotes: null,
    ads: [mockAd],
    adAccount: null,
    abTests: [],
    performanceSnapshots: [],
  };

  const mockClonedCampaign = {
    id: CLONED_ID,
    organizationId: ORG,
    name: 'Summer Sale Copy',
    description: 'Best deals',
    objective: 'CONVERSIONS',
    status: 'DRAFT',
    adAccountId: null,
    dailyBudget: 100,
    totalBudget: 3000,
    spentBudget: 0,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    audienceJson: null,
    aiGenerated: false,
    aiNotes: null,
    ads: [],
    adAccount: null,
    abTests: [],
    performanceSnapshots: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignManagerService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((cb: any) => cb(prisma)),
            marketingCampaign: {
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              findMany: jest.fn(),
            },
            ad: {
              create: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            adPlatformAccount: {
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: RequestContextService,
          useValue: {
            getCorrelationId: jest.fn().mockReturnValue('corr-123'),
            getUserId: jest.fn().mockReturnValue(undefined),
          },
        },
        {
          provide: EventBus,
          useValue: {
            publish: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get(CampaignManagerService);
    prisma = module.get(PrismaService) as any;

    (prisma.$transaction as jest.Mock).mockImplementation((cb: any) => cb(prisma));
  });

  describe('cloneCampaign', () => {
    it('creates a copy of the campaign in DRAFT status with all ads cloned', async () => {
      (prisma.marketingCampaign.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockCampaign)   // source lookup in cloneCampaign
        .mockResolvedValueOnce(mockClonedCampaign); // getCampaign after clone

      (prisma.marketingCampaign.create as jest.Mock).mockResolvedValue(mockClonedCampaign);
      (prisma.ad.create as jest.Mock).mockResolvedValue({ id: 'ad_clone_1' });

      const result = await service.cloneCampaign(ORG, SRC_ID);

      expect(prisma.marketingCampaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: ORG,
            name: 'Summer Sale Copy',
            status: 'DRAFT',
            objective: 'CONVERSIONS',
          }),
        }),
      );

      expect(prisma.ad.create).toHaveBeenCalledTimes(1);
      expect(prisma.ad.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            campaignId: CLONED_ID,
            name: mockAd.name,
            status: 'DRAFT',
          }),
        }),
      );

      expect(result.id).toBe(CLONED_ID);
    });

    it('uses provided name when specified', async () => {
      (prisma.marketingCampaign.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockCampaign)
        .mockResolvedValueOnce({ ...mockClonedCampaign, name: 'Custom Copy' });

      (prisma.marketingCampaign.create as jest.Mock).mockResolvedValue({
        ...mockClonedCampaign,
        id: CLONED_ID,
        name: 'Custom Copy',
      });

      await service.cloneCampaign(ORG, SRC_ID, { name: 'Custom Copy' });

      expect(prisma.marketingCampaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Custom Copy' }),
        }),
      );
    });

    it('overrides dates when provided', async () => {
      (prisma.marketingCampaign.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockCampaign)
        .mockResolvedValueOnce(mockClonedCampaign);

      (prisma.marketingCampaign.create as jest.Mock).mockResolvedValue(mockClonedCampaign);

      await service.cloneCampaign(ORG, SRC_ID, {
        startDate: '2026-03-01',
        endDate: '2026-06-30',
      });

      const createCall = (prisma.marketingCampaign.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.startDate).toEqual(new Date('2026-03-01'));
      expect(createCall.data.endDate).toEqual(new Date('2026-06-30'));
    });

    it('throws NotFoundException when source campaign does not belong to org', async () => {
      (prisma.marketingCampaign.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.cloneCampaign(ORG, 'bad_id')).rejects.toThrow(NotFoundException);
    });

    it('publishes a marketing.campaign.cloned event', async () => {
      const eventBus = service['eventBus'] as jest.Mocked<EventBus>;

      (prisma.marketingCampaign.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockCampaign)
        .mockResolvedValueOnce(mockClonedCampaign);

      (prisma.marketingCampaign.create as jest.Mock).mockResolvedValue(mockClonedCampaign);

      await service.cloneCampaign(ORG, SRC_ID);

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventName: 'marketing.campaign.cloned',
            properties: expect.objectContaining({
              sourceCampaignId: SRC_ID,
              clonedCampaignId: CLONED_ID,
            }),
          }),
        }),
      );
    });
  });

  describe('createCampaign', () => {
    it('publishes a marketing.campaign.created event', async () => {
      const eventBus = service['eventBus'] as jest.Mocked<EventBus>;
      const newCampaign = {
        ...mockCampaign,
        id: 'cmp_new',
        status: 'DRAFT',
        ads: [],
        adAccount: null,
        abTests: [],
        performanceSnapshots: [],
      };

      (prisma.marketingCampaign.create as jest.Mock).mockResolvedValue(newCampaign);

      await service.createCampaign(ORG, {
        name: 'New Campaign',
        objective: 'CONVERSIONS' as any,
      });

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventName: 'marketing.campaign.created',
          }),
        }),
      );
    });
  });
});
