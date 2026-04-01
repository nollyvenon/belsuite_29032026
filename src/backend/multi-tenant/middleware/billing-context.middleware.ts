import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../../database/prisma.service';

declare global {
  namespace Express {
    interface Request {
      billingContext?: {
        organizationId: string;
        organizationTier: string;
        effectiveTier: string;
        subscriptionStatus: string | null;
        currentPeriodEnd: string | null;
        activeCouponCode: string | null;
        usage: {
          aiTokensUsed: number;
          apiCallsCount: number;
          emailsSent: number;
          storageUsedGb: number;
        };
      };
    }
  }
}

@Injectable()
export class BillingContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(BillingContextMiddleware.name);

  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const organizationId = req.tenantId ?? req.tenant?.organizationId;
    if (!organizationId) {
      next();
      return;
    }

    try {
      const period = this.getCurrentMonth();
      const [organization, subscription, usage, aiUsage] = await Promise.all([
        this.prisma.organization.findUnique({
          where: { id: organizationId },
          select: { id: true, tier: true, metadata: true },
        }),
        this.prisma.subscription.findUnique({
          where: { organizationId },
          include: { plan: true },
        }),
        this.prisma.tenantUsage.findUnique({
          where: {
            organizationId_period: {
              organizationId,
              period,
            },
          },
        }),
        this.prisma.aIUsage.aggregate({
          where: {
            organizationId,
            createdAt: {
              gte: this.getCurrentMonthStart(),
              lte: this.getCurrentMonthEnd(),
            },
          },
          _sum: { totalTokens: true },
        }),
      ]);

      if (organization) {
        const metadata = this.parseMetadata(organization.metadata);
        req.billingContext = {
          organizationId,
          organizationTier: organization.tier,
          effectiveTier: subscription?.plan?.tier ?? organization.tier,
          subscriptionStatus: subscription?.status ?? null,
          currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString() ?? null,
          activeCouponCode: metadata?.billing?.activeCoupon?.code ?? null,
          usage: {
            aiTokensUsed: aiUsage._sum.totalTokens ?? usage?.aiTokensUsed ?? 0,
            apiCallsCount: usage?.apiCallsCount ?? 0,
            emailsSent: usage?.emailsSent ?? 0,
            storageUsedGb: Number(usage?.storageUsedBytes ?? 0) / (1024 * 1024 * 1024),
          },
        };
      }
    } catch (error) {
      this.logger.warn(`Failed to attach billing context: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    next();
  }

  private getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private getCurrentMonthStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private getCurrentMonthEnd() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  private parseMetadata(metadata: string | null) {
    if (!metadata) return null;
    try {
      return JSON.parse(metadata) as { billing?: { activeCoupon?: { code?: string } } };
    } catch {
      return null;
    }
  }
}