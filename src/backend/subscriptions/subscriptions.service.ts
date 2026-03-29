import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get subscription plans
   */
  async getPlans() {
    return this.prisma.billingPlan.findMany({
      orderBy: { pricePerMonth: 'asc' },
    });
  }

  /**
   * Get organization subscription
   */
  async getSubscription(organizationId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId },
      include: {
        plan: true,
        invoices: { take: 10, orderBy: { issuedAt: 'desc' } },
      },
    });

    if (!subscription) {
      return null;
    }

    return subscription;
  }

  /**
   * Create subscription (Stripe integration to be implemented)
   */
  async createSubscription(
    organizationId: string,
    planId: string,
    billingProfileId: string,
  ) {
    // TODO: Integrate with Stripe
    // 1. Create Stripe subscription
    // 2. Store subscription data
    // 3. Setup webhook for subscription events

    const subscription = await this.prisma.subscription.create({
      data: {
        organizationId,
        planId,
        status: 'TRIAL',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 day trial
      },
    });

    return subscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(organizationId: string) {
    // TODO: Integrate with Stripe to cancel subscription

    const subscription = await this.prisma.subscription.update({
      where: { organizationId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    return subscription;
  }

  /**
   * Update billing profile
   */
  async updateBillingProfile(organizationId: string, billingData: any) {
    const profile = await this.prisma.billingProfile.updateMany({
      where: { organizationId },
      data: billingData,
    });

    return profile;
  }

  /**
   * Get invoices for organization
   */
  async getInvoices(organizationId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          subscription: { organizationId },
        },
        skip,
        take: limit,
        orderBy: { issuedAt: 'desc' },
      }),
      this.prisma.invoice.count({
        where: {
          subscription: { organizationId },
        },
      }),
    ]);

    return {
      data: invoices,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }
}
