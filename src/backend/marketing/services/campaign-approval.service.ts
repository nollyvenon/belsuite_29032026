import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CampaignApprovalService {
  constructor(private readonly prisma: PrismaService) {}

  async submitForApproval(
    organizationId: string,
    campaignId: string,
    submittedById: string,
    data: {
      workflowId: string;
      comments?: string;
      contentSnapshot?: Record<string, unknown>;
      version?: number;
    },
  ) {
    const [campaign, workflow] = await Promise.all([
      this.prisma.marketingCampaign.findFirst({
        where: { id: campaignId, organizationId },
        include: { ads: true },
      }),
      this.prisma.teamWorkflow.findFirst({
        where: {
          id: data.workflowId,
          team: { organizationId },
          isActive: true,
          applicableContentTypes: { has: 'marketing_campaign' },
        },
      }),
    ]);

    if (!campaign) throw new NotFoundException('Campaign not found');
    if (!workflow) {
      throw new BadRequestException(
        'Workflow not found or not applicable to marketing campaigns',
      );
    }

    const existing = await this.prisma.workflowApproval.findFirst({
      where: {
        workflowId: workflow.id,
        contentId: campaignId,
        contentType: 'marketing_campaign',
        status: 'PENDING',
      },
    });

    if (existing) {
      throw new ConflictException(
        'Campaign already has a pending approval request',
      );
    }

    const snapshot =
      data.contentSnapshot ??
      ({
        campaign: {
          id: campaign.id,
          name: campaign.name,
          objective: campaign.objective,
          status: campaign.status,
          dailyBudget: campaign.dailyBudget,
          totalBudget: campaign.totalBudget,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
        },
        ads: campaign.ads.map((ad) => ({
          id: ad.id,
          name: ad.name,
          format: ad.format,
          headline: ad.headline,
          body: ad.body,
          destinationUrl: ad.destinationUrl,
        })),
      });

    return this.prisma.$transaction(async (tx) => {
      const approval = await tx.workflowApproval.create({
        data: {
          workflowId: workflow.id,
          contentId: campaignId,
          contentType: 'marketing_campaign',
          submittedById,
          comments: data.comments,
          requiredApprovals: workflow.requiredApprovals,
          version: data.version ?? 1,
          contentSnapshot: JSON.stringify(snapshot),
        },
      });

      await tx.teamWorkflow.update({
        where: { id: workflow.id },
        data: { totalSubmissions: { increment: 1 } },
      });

      return approval;
    });
  }

  async listCampaignApprovals(organizationId: string, campaignId: string) {
    await this.assertCampaignOwnership(organizationId, campaignId);

    return this.prisma.workflowApproval.findMany({
      where: {
        contentId: campaignId,
        contentType: 'marketing_campaign',
        workflow: { team: { organizationId } },
      },
      include: {
        workflow: { select: { id: true, name: true, teamId: true } },
        submittedBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        approvals: {
          include: {
            approver: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async respondToApproval(
    organizationId: string,
    approvalId: string,
    approverId: string,
    data: { decision: 'APPROVED' | 'REJECTED'; decisionReason?: string },
  ) {
    const approval = await this.prisma.workflowApproval.findUnique({
      where: { id: approvalId },
      include: {
        workflow: {
          include: {
            team: { select: { organizationId: true } },
          },
        },
      },
    });

    if (!approval) throw new NotFoundException('Approval request not found');
    if (approval.workflow.team.organizationId !== organizationId) {
      throw new ForbiddenException('Approval not found in organization');
    }
    if (approval.status !== 'PENDING') {
      throw new ConflictException(`Approval is already ${approval.status}`);
    }

    const membership = await this.prisma.teamMember.findFirst({
      where: {
        teamId: approval.workflow.teamId,
        userId: approverId,
        isActive: true,
        role: { in: ['OWNER', 'ADMIN', 'APPROVER'] },
      },
      select: { id: true },
    });

    if (!membership) {
      throw new ForbiddenException('User is not allowed to approve this campaign');
    }

    const priorResponse = await this.prisma.approval.findUnique({
      where: {
        approvalRequestId_approverId: {
          approvalRequestId: approvalId,
          approverId,
        },
      },
      select: { id: true },
    });

    if (priorResponse) {
      throw new ConflictException('You have already responded to this approval');
    }

    return this.prisma.$transaction(async (tx) => {
      const response = await tx.approval.create({
        data: {
          approvalRequestId: approvalId,
          approverId,
          decision: data.decision,
          decisionReason: data.decisionReason,
          respondedAt: new Date(),
        },
      });

      const responses = await tx.approval.findMany({
        where: { approvalRequestId: approvalId },
        select: { decision: true },
      });

      const approvedCount = responses.filter(
        (item) => item.decision === 'APPROVED',
      ).length;
      const rejectedCount = responses.filter(
        (item) => item.decision === 'REJECTED',
      ).length;

      let nextStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
      if (rejectedCount > 0) nextStatus = 'REJECTED';
      else if (approvedCount >= approval.requiredApprovals) nextStatus = 'APPROVED';

      await tx.workflowApproval.update({
        where: { id: approvalId },
        data: {
          status: nextStatus,
          receivedApprovals: responses.length,
          rejectionReason:
            nextStatus === 'REJECTED' ? data.decisionReason ?? null : null,
          approvedAt: nextStatus === 'APPROVED' ? new Date() : null,
          rejectedAt: nextStatus === 'REJECTED' ? new Date() : null,
        },
      });

      if (nextStatus === 'APPROVED') {
        await tx.teamWorkflow.update({
          where: { id: approval.workflowId },
          data: { approvedCount: { increment: 1 } },
        });
      }

      if (nextStatus === 'REJECTED') {
        await tx.teamWorkflow.update({
          where: { id: approval.workflowId },
          data: { rejectedCount: { increment: 1 } },
        });
      }

      return {
        approvalId,
        responseId: response.id,
        status: nextStatus,
        receivedApprovals: responses.length,
        requiredApprovals: approval.requiredApprovals,
      };
    });
  }

  private async assertCampaignOwnership(organizationId: string, campaignId: string) {
    const campaign = await this.prisma.marketingCampaign.findFirst({
      where: { id: campaignId, organizationId },
      select: { id: true },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');
  }
}