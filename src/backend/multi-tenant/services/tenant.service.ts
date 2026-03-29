/**
 * Tenant Service
 * Core business logic for tenant operations: creation, updates, domain management
 */

import { Injectable, BadRequestException, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OnboardingStep } from '@prisma/client';
import * as crypto from 'crypto';

export interface CreateTenantDto {
  name: string;
  slug: string;
  email: string;
  tier?: string;
  companyName?: string;
  website?: string;
  industry?: string;
}

export interface UpdateTenantDto {
  name?: string;
  tier?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new tenant (organization)
   */
  async createTenant(dto: CreateTenantDto, creatorId?: string): Promise<any> {
    // Validate slug format
    if (!this.isValidSlug(dto.slug)) {
      throw new BadRequestException('Invalid slug format. Use lowercase letters, numbers, and hyphens.');
    }

    // Check if slug already taken
    const existing = await this.prisma.organization.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(`Slug "${dto.slug}" is already taken.`);
    }

    try {
      // Create organization with onboarding
      const organization = await this.prisma.organization.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          email: dto.email,
          tier: dto.tier || 'starter',
          encryptionKey: this.generateEncryptionKey(),
          tenantOnboarding: {
            create: {
              step: OnboardingStep.WELCOME,
              companyName: dto.companyName,
              website: dto.website,
              industry: dto.industry,
            },
          },
          tenantRateLimits: {
            create: {
              apiRequestsPerMinute: 60,
              apiRequestsPerHour: 5000,
              apiRequestsPerDay: 100000,
              emailsPerMinute: 10,
              emailsPerHour: 500,
              emailsPerDay: 5000,
              aiTokensPerMinute: 100000,
              aiTokensPerHour: 10000000,
              aiTokensPerDay: 100000000,
              maxStorageGB: 10,
              maxConcurrentRequests: 10,
              maxConcurrentUploads: 5,
              enforceRateLimits: true,
            },
          },
        },
        include: {
          tenantOnboarding: true,
          tenantRateLimits: true,
        },
      });

      // Create auto-generated subdomain mapping
      await this.prisma.domainMapping.create({
        data: {
          organizationId: organization.id,
          subdomain: dto.slug,
          domainType: 'SUBDOMAIN',
          isPrimary: true,
          isActive: true,
        },
      });

      this.logger.log(`Tenant created: ${organization.slug} (${organization.id})`);

      return organization;
    } catch (error) {
      this.logger.error(`Failed to create tenant: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get tenant by ID
   */
  async getTenant(organizationId: string): Promise<any> {
    const tenant = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        tenantOnboarding: true,
        tenantRateLimits: true,
        tenantDomains: {
          where: { isActive: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant not found: ${organizationId}`);
    }

    return tenant;
  }

  /**
   * Get tenant by slug
   */
  async getTenantBySlug(slug: string): Promise<any> {
    const tenant = await this.prisma.organization.findUnique({
      where: { slug },
      include: {
        tenantOnboarding: true,
        tenantRateLimits: true,
        tenantDomains: {
          where: { isActive: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant not found: ${slug}`);
    }

    return tenant;
  }

  /**
   * List all tenants (admin only)
   */
  async listTenants(skip: number = 0, take: number = 20): Promise<any> {
    const [tenants, total] = await Promise.all([
      this.prisma.organization.findMany({
        skip,
        take,
        include: {
          tenantOnboarding: true,
          tenantRateLimits: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organization.count(),
    ]);

    return { tenants, total, skip, take };
  }

  /**
   * Update tenant
   */
  async updateTenant(organizationId: string, dto: UpdateTenantDto): Promise<any> {
    const tenant = await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.tier && { tier: dto.tier }),
        ...(dto.metadata && { metadata: dto.metadata }),
      },
      include: {
        tenantOnboarding: true,
        tenantRateLimits: true,
      },
    });

    this.logger.log(`Tenant updated: ${organizationId}`);

    return tenant;
  }

  /**
   * Delete tenant (soft delete)
   */
  async deleteTenant(organizationId: string): Promise<void> {
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    this.logger.log(`Tenant deleted: ${organizationId}`);
  }

  /**
   * Get tenant usage metrics
   */
  async getTenantUsage(organizationId: string, month?: string): Promise<any> {
    const targetMonth = month || this.getCurrentMonth();

    const usage = await this.prisma.tenantUsage.findUnique({
      where: {
        organizationId_period: {
          organizationId,
          period: targetMonth,
        },
      },
    });

    if (!usage) {
      // Return zero usage if not tracked yet
      return {
        month: targetMonth,
        aiTokensUsed: 0,
        aiRequestsCount: 0,
        storageUsedBytes: 0,
        apiCallsCount: 0,
        emailsSent: 0,
        emailsDelivered: 0,
        emailsBounced: 0,
        emailsOpened: 0,
        emailsClicked: 0,
        contentCount: 0,
        activeUsers: 0,
        estimatedCost: 0,
      };
    }

    return usage;
  }

  /**
   * Get tenant usage history (last 12 months)
   */
  async getTenantUsageHistory(organizationId: string): Promise<any[]> {
    const startMonth = this.getMonthsAgo(12);

    const usage = await this.prisma.tenantUsage.findMany({
      where: {
        organizationId,
        period: {
          gte: startMonth,
        },
      },
      orderBy: { period: 'desc' },
      take: 12,
    });

    return usage;
  }

  /**
   * Validate slug format
   */
  private isValidSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    return (
      slugRegex.test(slug) &&
      slug.length >= 3 &&
      slug.length <= 63 &&
      !slug.startsWith('-') &&
      !slug.endsWith('-')
    );
  }

  /**
   * Generate encryption key for tenant
   */
  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get current month in YYYY-MM format
   */
  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Get month N months ago
   */
  private getMonthsAgo(months: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}
