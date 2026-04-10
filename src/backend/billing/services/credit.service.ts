import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService }  from '../../database/prisma.service';
import { CreditTxType }   from '@prisma/client';

export interface DebitOptions {
  organizationId:  string;
  userId?:         string;
  feature:         string;
  credits:         number;
  description:     string;
  usageRecordId?:  string;
  meta?:           Record<string, any>;
}

export interface CreditOptions {
  organizationId: string;
  credits:        number;
  type:           CreditTxType;
  description:    string;
  bundleId?:      string;
  paymentId?:     string;
  invoiceId?:     string;
  meta?:          Record<string, any>;
}

@Injectable()
export class CreditService {
  private readonly logger = new Logger(CreditService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Balance ──────────────────────────────────────────────────────────────

  async getOrCreateAccount(organizationId: string) {
    return this.prisma.creditAccount.upsert({
      where:  { organizationId },
      update: {},
      create: { organizationId, balanceCredits: 0 },
    });
  }

  async getBalance(organizationId: string): Promise<number> {
    const account = await this.prisma.creditAccount.findUnique({ where: { organizationId } });
    return account?.balanceCredits ?? 0;
  }

  async hasEnough(organizationId: string, required: number): Promise<boolean> {
    const balance = await this.getBalance(organizationId);
    return balance >= required;
  }

  // ── Debit (usage charge) ─────────────────────────────────────────────────

  async debit(opts: DebitOptions): Promise<void> {
    const { organizationId, credits, description, usageRecordId, meta } = opts;
    if (credits <= 0) return;

    await this.prisma.$transaction(async tx => {
      const account = await tx.creditAccount.findUnique({ where: { organizationId } });
      if (!account) throw new BadRequestException('Credit account not found');
      if (account.balanceCredits < credits) {
        throw new BadRequestException(
          `Insufficient credits: need ${credits.toFixed(4)}, have ${account.balanceCredits.toFixed(4)}`,
        );
      }

      const newBalance = account.balanceCredits - credits;

      await tx.creditAccount.update({
        where: { organizationId },
        data: {
          balanceCredits: newBalance,
          lifetimeSpent:  { increment: credits },
        },
      });

      await tx.creditTransaction.create({
        data: {
          accountId:     account.id,
          organizationId,
          type:          CreditTxType.USAGE_DEBIT,
          amount:        -credits,
          balanceAfter:  newBalance,
          description,
          usageRecordId,
          metadata:      meta ?? {},
        },
      });
    });
  }

  // ── Credit (top-up / plan allocation) ───────────────────────────────────

  async credit(opts: CreditOptions): Promise<void> {
    const { organizationId, credits, type, description, bundleId, paymentId, invoiceId, meta } = opts;
    if (credits <= 0) return;

    await this.prisma.$transaction(async tx => {
      const account = await tx.creditAccount.upsert({
        where:  { organizationId },
        update: {},
        create: { organizationId },
      });

      const newBalance = account.balanceCredits + credits;

      await tx.creditAccount.update({
        where: { organizationId },
        data: {
          balanceCredits: newBalance,
          lifetimeEarned: { increment: credits },
        },
      });

      await tx.creditTransaction.create({
        data: {
          accountId:     account.id,
          organizationId,
          type,
          amount:        credits,
          balanceAfter:  newBalance,
          description,
          bundleId,
          paymentId,
          invoiceId,
          metadata:      meta ?? {},
        },
      });
    });

    // Check auto-topup threshold
    await this.checkLowBalanceAlert(organizationId);
  }

  // ── Reserve / Release (for in-flight operations) ─────────────────────────

  async reserve(organizationId: string, credits: number, description: string): Promise<void> {
    await this.prisma.$transaction(async tx => {
      const account = await tx.creditAccount.findUnique({ where: { organizationId } });
      if (!account || account.balanceCredits < credits) {
        throw new BadRequestException('Insufficient credits for reservation');
      }

      const newBalance = account.balanceCredits - credits;
      await tx.creditAccount.update({
        where: { organizationId },
        data: {
          balanceCredits:  newBalance,
          reservedCredits: { increment: credits },
        },
      });

      await tx.creditTransaction.create({
        data: {
          accountId: account.id, organizationId,
          type: CreditTxType.RESERVATION,
          amount: -credits, balanceAfter: newBalance, description,
        },
      });
    });
  }

  async releaseReservation(organizationId: string, credits: number, description: string): Promise<void> {
    await this.prisma.$transaction(async tx => {
      const account = await tx.creditAccount.findUnique({ where: { organizationId } });
      if (!account) return;

      const newBalance = account.balanceCredits + credits;
      await tx.creditAccount.update({
        where: { organizationId },
        data: {
          balanceCredits:  newBalance,
          reservedCredits: { decrement: Math.min(credits, account.reservedCredits) },
        },
      });

      await tx.creditTransaction.create({
        data: {
          accountId: account.id, organizationId,
          type: CreditTxType.RESERVATION_RELEASE,
          amount: credits, balanceAfter: newBalance, description,
        },
      });
    });
  }

  // ── Adjustment (admin manual) ─────────────────────────────────────────────

  async adjust(organizationId: string, delta: number, reason: string): Promise<void> {
    await this.prisma.$transaction(async tx => {
      const account = await tx.creditAccount.upsert({
        where:  { organizationId },
        update: {},
        create: { organizationId },
      });

      const newBalance = Math.max(0, account.balanceCredits + delta);
      await tx.creditAccount.update({
        where: { organizationId },
        data: {
          balanceCredits: newBalance,
          lifetimeEarned: delta > 0 ? { increment: delta } : undefined,
        },
      });

      await tx.creditTransaction.create({
        data: {
          accountId: account.id, organizationId,
          type: CreditTxType.ADJUSTMENT,
          amount: delta, balanceAfter: newBalance, description: reason,
        },
      });
    });
  }

  // ── History ──────────────────────────────────────────────────────────────

  async getTransactions(
    organizationId: string,
    options?: { limit?: number; offset?: number; type?: CreditTxType },
  ) {
    return this.prisma.creditTransaction.findMany({
      where:   { organizationId, ...(options?.type ? { type: options.type } : {}) },
      orderBy: { createdAt: 'desc' },
      take:    options?.limit  ?? 50,
      skip:    options?.offset ?? 0,
    });
  }

  // ── Plan allocation (monthly credits) ────────────────────────────────────

  async allocatePlanCredits(organizationId: string, planCredits: number): Promise<void> {
    return this.credit({
      organizationId,
      credits:     planCredits,
      type:        CreditTxType.PLAN_ALLOCATION,
      description: 'Monthly plan credit allocation',
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async checkLowBalanceAlert(organizationId: string): Promise<void> {
    const account = await this.prisma.creditAccount.findUnique({ where: { organizationId } });
    if (!account?.lowBalanceAlert) return;
    if (account.balanceCredits <= account.lowBalanceAlert) {
      this.logger.warn(`Low balance alert for org ${organizationId}: ${account.balanceCredits} credits`);
      // Hook point: emit event, send email, etc.
    }
  }
}
