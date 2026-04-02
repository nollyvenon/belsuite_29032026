import { Injectable } from '@nestjs/common';
import { ReferralStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateReferralLinkDto, TrackReferralDto } from './dto/referral.dto';

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

@Injectable()
export class ReferralEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async createLink(organizationId: string, userId: string, dto: CreateReferralLinkDto) {
    const code = this.generateCode(8);
    return this.prisma.referralLink.create({
      data: {
        organizationId,
        referrerId: userId,
        code,
        campaignName: dto.campaignName,
        rewardType: dto.rewardType ?? 'credit',
        rewardValue: dto.rewardValue ?? 0,
        maxUses: dto.maxUses,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  async listLinks(organizationId: string) {
    return this.prisma.referralLink.findMany({
      where: { organizationId },
      include: { referrals: { select: { status: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async trackClick(code: string) {
    const link = await this.prisma.referralLink.findUnique({ where: { code } });
    if (!link || !link.isActive) return { error: 'Invalid or inactive referral code' };
    if (link.expiresAt && link.expiresAt < new Date()) return { error: 'Referral link expired' };
    if (link.maxUses && link.totalClicks >= link.maxUses) return { error: 'Referral limit reached' };

    return this.prisma.referralLink.update({
      where: { id: link.id },
      data: { totalClicks: { increment: 1 } },
    });
  }

  async trackSignup(dto: TrackReferralDto) {
    const link = await this.prisma.referralLink.findUnique({ where: { code: dto.code } });
    if (!link) return { error: 'Invalid referral code' };

    const referral = await this.prisma.referral.create({
      data: {
        organizationId: link.organizationId,
        linkId: link.id,
        referredEmail: dto.referredEmail,
        referredUserId: dto.referredUserId,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        status: ReferralStatus.SIGNED_UP,
      },
    });

    await this.prisma.referralLink.update({
      where: { id: link.id },
      data: { totalSignups: { increment: 1 } },
    });

    return { referralId: referral.id, reward: { type: link.rewardType, value: link.rewardValue } };
  }

  async markConverted(organizationId: string, referralId: string) {
    const referral = await this.prisma.referral.findFirst({
      where: { id: referralId, organizationId },
      include: { link: true },
    });
    if (!referral) return { error: 'Referral not found' };

    const [updatedReferral] = await Promise.all([
      this.prisma.referral.update({
        where: { id: referralId },
        data: { status: ReferralStatus.CONVERTED, convertedAt: new Date() },
      }),
      this.prisma.referralLink.update({
        where: { id: referral.linkId },
        data: { totalConverted: { increment: 1 } },
      }),
    ]);

    return {
      referralId,
      status: 'CONVERTED',
      reward: { type: referral.link.rewardType, value: referral.link.rewardValue },
    };
  }

  async getStats(organizationId: string) {
    const [links, referrals] = await Promise.all([
      this.prisma.referralLink.findMany({ where: { organizationId } }),
      this.prisma.referral.findMany({ where: { organizationId } }),
    ]);

    const totalClicks = links.reduce((s, l) => s + l.totalClicks, 0);
    const totalSignups = links.reduce((s, l) => s + l.totalSignups, 0);
    const totalConverted = links.reduce((s, l) => s + l.totalConverted, 0);
    const totalRewardPaid = referrals.reduce((s, r) => s + r.rewardPaid, 0);

    return {
      totalLinks: links.length,
      activeLinks: links.filter((l) => l.isActive).length,
      totalClicks,
      totalSignups,
      totalConverted,
      totalRewardPaid: Math.round(totalRewardPaid * 100) / 100,
      signupRate: totalClicks > 0 ? Math.round((totalSignups / totalClicks) * 1000) / 10 : 0,
      conversionRate: totalSignups > 0 ? Math.round((totalConverted / totalSignups) * 1000) / 10 : 0,
      topLinks: links
        .sort((a, b) => b.totalConverted - a.totalConverted)
        .slice(0, 5)
        .map((l) => ({ id: l.id, code: l.code, campaignName: l.campaignName, converted: l.totalConverted })),
    };
  }

  private generateCode(length: number): string {
    return Array.from({ length }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  }
}
