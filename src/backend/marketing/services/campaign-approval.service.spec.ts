import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CampaignApprovalService } from './campaign-approval.service';

describe('CampaignApprovalService', () => {
  let service: CampaignApprovalService;
  let prisma: jest.Mocked<PrismaService>;

  const ORG = 'org_1';
  const CAMPAIGN_ID = 'cmp_1';
  const WORKFLOW_ID = 'wf_1';
  const USER_ID = 'usr_1';
  const APPROVER_ID = 'usr_2';
  const APPROVAL_ID = 'apr_1';

  const mockCampaign = {
    id: CAMPAIGN_ID,
    organizationId: ORG,
    name: 'Test Campaign',
    objective: 'CONVERSIONS',
    status: 'DRAFT',
    dailyBudget: 100,
    totalBudget: 3000,
    startDate: null,
    endDate: null,
    ads: [],
  };

  const mockWorkflow = {
    id: WORKFLOW_ID,
    teamId: 'team_1',
    name: 'Marketing Review',
    requiredApprovals: 1,
    isActive: true,
    applicableContentTypes: ['marketing_campaign'],
    totalSubmissions: 0,
    approvedCount: 0,
    rejectedCount: 0,
  };

  const mockApproval = {
    id: APPROVAL_ID,
    workflowId: WORKFLOW_ID,
    contentId: CAMPAIGN_ID,
    contentType: 'marketing_campaign',
    submittedById: USER_ID,
    status: 'PENDING',
    requiredApprovals: 1,
    receivedApprovals: 0,
    comments: null,
    version: 1,
    contentSnapshot: null,
    submittedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignApprovalService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((cb: any) => cb(prisma)),
            marketingCampaign: {
              findFirst: jest.fn(),
            },
            teamWorkflow: {
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            workflowApproval: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            teamMember: {
              findFirst: jest.fn(),
            },
            approval: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(CampaignApprovalService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;

    (prisma.$transaction as jest.Mock).mockImplementation((cb: any) => cb(prisma));
  });

  // ── submitForApproval ──────────────────────────────────────────────────────

  describe('submitForApproval', () => {
    it('creates a workflow approval and increments submission count', async () => {
      (prisma.marketingCampaign.findFirst as jest.Mock).mockResolvedValue(mockCampaign);
      (prisma.teamWorkflow.findFirst as jest.Mock).mockResolvedValue(mockWorkflow);
      (prisma.workflowApproval.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.workflowApproval.create as jest.Mock).mockResolvedValue(mockApproval);
      (prisma.teamWorkflow.update as jest.Mock).mockResolvedValue(mockWorkflow);

      const result = await service.submitForApproval(ORG, CAMPAIGN_ID, USER_ID, {
        workflowId: WORKFLOW_ID,
        comments: 'Ready for review',
      });

      expect(prisma.workflowApproval.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workflowId: WORKFLOW_ID,
            contentId: CAMPAIGN_ID,
            contentType: 'marketing_campaign',
            submittedById: USER_ID,
          }),
        }),
      );
      expect(prisma.teamWorkflow.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { totalSubmissions: { increment: 1 } },
        }),
      );
      expect(result.id).toBe(APPROVAL_ID);
    });

    it('throws NotFoundException when campaign does not belong to org', async () => {
      (prisma.marketingCampaign.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.teamWorkflow.findFirst as jest.Mock).mockResolvedValue(mockWorkflow);

      await expect(
        service.submitForApproval(ORG, CAMPAIGN_ID, USER_ID, { workflowId: WORKFLOW_ID }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when workflow not found or inapplicable', async () => {
      (prisma.marketingCampaign.findFirst as jest.Mock).mockResolvedValue(mockCampaign);
      (prisma.teamWorkflow.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.submitForApproval(ORG, CAMPAIGN_ID, USER_ID, { workflowId: 'bad_wf' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when a PENDING approval already exists', async () => {
      (prisma.marketingCampaign.findFirst as jest.Mock).mockResolvedValue(mockCampaign);
      (prisma.teamWorkflow.findFirst as jest.Mock).mockResolvedValue(mockWorkflow);
      (prisma.workflowApproval.findFirst as jest.Mock).mockResolvedValue(mockApproval);

      await expect(
        service.submitForApproval(ORG, CAMPAIGN_ID, USER_ID, { workflowId: WORKFLOW_ID }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── listCampaignApprovals ──────────────────────────────────────────────────

  describe('listCampaignApprovals', () => {
    it('returns approvals for the campaign', async () => {
      (prisma.marketingCampaign.findFirst as jest.Mock).mockResolvedValue(mockCampaign);
      (prisma.workflowApproval.findMany as jest.Mock).mockResolvedValue([mockApproval]);

      const result = await service.listCampaignApprovals(ORG, CAMPAIGN_ID);
      expect(result).toHaveLength(1);
    });

    it('throws NotFoundException when campaign not in org', async () => {
      (prisma.marketingCampaign.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.listCampaignApprovals(ORG, CAMPAIGN_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── respondToApproval ─────────────────────────────────────────────────────

  describe('respondToApproval', () => {
    const mockWorkflowApproval = {
      id: APPROVAL_ID,
      workflowId: WORKFLOW_ID,
      status: 'PENDING',
      requiredApprovals: 1,
      workflow: {
        teamId: 'team_1',
        team: { organizationId: ORG },
      },
    };

    it('approves when sufficient approvals are received', async () => {
      (prisma.workflowApproval.findUnique as jest.Mock).mockResolvedValue(mockWorkflowApproval);
      (prisma.teamMember.findFirst as jest.Mock).mockResolvedValue({ id: 'mem_1' });
      (prisma.approval.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.approval.create as jest.Mock).mockResolvedValue({ id: 'resp_1', decision: 'APPROVED' });
      (prisma.approval.findMany as jest.Mock).mockResolvedValue([{ decision: 'APPROVED' }]);
      (prisma.workflowApproval.update as jest.Mock).mockResolvedValue({});
      (prisma.teamWorkflow.update as jest.Mock).mockResolvedValue({});

      const result = await service.respondToApproval(ORG, APPROVAL_ID, APPROVER_ID, {
        decision: 'APPROVED',
      });

      expect(result.status).toBe('APPROVED');
      expect(prisma.teamWorkflow.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { approvedCount: { increment: 1 } } }),
      );
    });

    it('rejects immediately on any REJECTED response', async () => {
      (prisma.workflowApproval.findUnique as jest.Mock).mockResolvedValue(mockWorkflowApproval);
      (prisma.teamMember.findFirst as jest.Mock).mockResolvedValue({ id: 'mem_1' });
      (prisma.approval.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.approval.create as jest.Mock).mockResolvedValue({ id: 'resp_1', decision: 'REJECTED' });
      (prisma.approval.findMany as jest.Mock).mockResolvedValue([{ decision: 'REJECTED' }]);
      (prisma.workflowApproval.update as jest.Mock).mockResolvedValue({});
      (prisma.teamWorkflow.update as jest.Mock).mockResolvedValue({});

      const result = await service.respondToApproval(ORG, APPROVAL_ID, APPROVER_ID, {
        decision: 'REJECTED',
      });

      expect(result.status).toBe('REJECTED');
    });

    it('throws NotFoundException when approval does not exist', async () => {
      (prisma.workflowApproval.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.respondToApproval(ORG, 'bad_id', APPROVER_ID, { decision: 'APPROVED' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for a different org', async () => {
      (prisma.workflowApproval.findUnique as jest.Mock).mockResolvedValue({
        ...mockWorkflowApproval,
        workflow: {
          teamId: 'team_1',
          team: { organizationId: 'other_org' },
        },
      });

      await expect(
        service.respondToApproval(ORG, APPROVAL_ID, APPROVER_ID, { decision: 'APPROVED' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ConflictException when approval is already resolved', async () => {
      (prisma.workflowApproval.findUnique as jest.Mock).mockResolvedValue({
        ...mockWorkflowApproval,
        status: 'APPROVED',
      });

      await expect(
        service.respondToApproval(ORG, APPROVAL_ID, APPROVER_ID, { decision: 'APPROVED' }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ForbiddenException when user is not a team approver', async () => {
      (prisma.workflowApproval.findUnique as jest.Mock).mockResolvedValue(mockWorkflowApproval);
      (prisma.teamMember.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.respondToApproval(ORG, APPROVAL_ID, APPROVER_ID, { decision: 'APPROVED' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ConflictException when user has already responded', async () => {
      (prisma.workflowApproval.findUnique as jest.Mock).mockResolvedValue(mockWorkflowApproval);
      (prisma.teamMember.findFirst as jest.Mock).mockResolvedValue({ id: 'mem_1' });
      (prisma.approval.findUnique as jest.Mock).mockResolvedValue({ id: 'resp_exists' });

      await expect(
        service.respondToApproval(ORG, APPROVAL_ID, APPROVER_ID, { decision: 'APPROVED' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
