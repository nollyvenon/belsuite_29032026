/**
 * Domain Mapping Service
 * Manages tenant domain mapping (subdomains, custom domains, SSL certs)
 */

import { Injectable, BadRequestException, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DomainType } from '@prisma/client';

export interface AddDomainDto {
  domain?: string;
  subdomain?: string;
  domainType: 'SUBDOMAIN' | 'CUSTOM';
  sslCertificate?: string;
  sslPrivateKey?: string;
}

export interface DomainMappingResult {
  id: string;
  domain?: string | null;
  subdomain?: string | null;
  domainType: string;
  isPrimary: boolean;
  isActive: boolean;
  sslVerified: boolean;
  dnsVerificationToken?: string | null;
  dnsVerificationRecord?: string | null;
  redirectUrl?: string | null;
  createdAt: Date;
}

@Injectable()
export class DomainMappingService {
  private readonly logger = new Logger(DomainMappingService.name);
  private readonly baseDomain = process.env.BELSUITE_BASE_DOMAIN || 'belsuite.com';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Add a domain to tenant
   */
  async addDomain(
    organizationId: string,
    dto: AddDomainDto,
  ): Promise<DomainMappingResult> {
    // Validate
    if (dto.domainType === 'SUBDOMAIN' && !dto.subdomain) {
      throw new BadRequestException('Subdomain is required for SUBDOMAIN type');
    }

    if (dto.domainType === 'CUSTOM' && !dto.domain) {
      throw new BadRequestException('Domain is required for CUSTOM type');
    }

    try {
      if (dto.domainType === 'SUBDOMAIN') {
        return await this.addSubdomain(organizationId, dto.subdomain!);
      } else {
        return await this.addCustomDomain(organizationId, dto);
      }
    } catch (error) {
      this.logger.error(`Failed to add domain: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Add subdomain to tenant
   */
  private async addSubdomain(
    organizationId: string,
    subdomain: string,
  ): Promise<DomainMappingResult> {
    // Validate subdomain format
    if (!this.isValidSubdomain(subdomain)) {
      throw new BadRequestException(
        'Invalid subdomain format. Use lowercase letters, numbers, and hyphens only.',
      );
    }

    // Check if subdomain is reserved
    if (this.isReservedSubdomain(subdomain)) {
      throw new BadRequestException(`Subdomain "${subdomain}" is reserved.`);
    }

    // Check if subdomain already taken
    const existing = await this.prisma.domainMapping.findUnique({
      where: { subdomain },
    });

    if (existing) {
      if (existing.organizationId === organizationId) {
        throw new ConflictException(`You already own this subdomain.`);
      }
      throw new ConflictException(`Subdomain "${subdomain}" is already taken.`);
    }

    const fullDomain = `${subdomain}.${this.baseDomain}`;
    const domain = await this.prisma.domainMapping.create({
      data: {
        organizationId,
        subdomain,
        domain: fullDomain,
        domainType: DomainType.SUBDOMAIN,
        isActive: true,
        isPrimary: false,
      },
    });

    this.logger.log(`Subdomain added: ${subdomain} for tenant ${organizationId}`);

    return this.mapToDomainResult(domain);
  }

  /**
   * Add custom domain to tenant
   */
  private async addCustomDomain(
    organizationId: string,
    dto: AddDomainDto,
  ): Promise<DomainMappingResult> {
    const domain = dto.domain!.toLowerCase();

    // Validate domain format
    if (!this.isValidDomain(domain)) {
      throw new BadRequestException('Invalid domain format.');
    }

    // Check if domain already taken
    const existing = await this.prisma.domainMapping.findUnique({
      where: { domain },
    });

    if (existing) {
      if (existing.organizationId === organizationId) {
        throw new ConflictException(`You already have this custom domain.`);
      }
      throw new ConflictException(`Domain "${domain}" is already taken.`);
    }

    // Generate DNS verification token
    const dnsVerificationToken = this.generateVerificationToken();
    const dnsVerificationRecord = `belsuite-verify=${dnsVerificationToken}`;

    const domainMapping = await this.prisma.domainMapping.create({
      data: {
        organizationId,
        domain,
        domainType: DomainType.CUSTOM,
        isActive: true,
        isPrimary: false,
        dnsVerificationToken,
        dnsVerificationRecord,
        sslCertificate: dto.sslCertificate,
        sslPrivateKey: dto.sslPrivateKey,
        sslVerified: !!dto.sslCertificate, // Mark as verified if cert provided
      },
    });

    this.logger.log(`Custom domain added: ${domain} for tenant ${organizationId}`);

    return this.mapToDomainResult(domainMapping);
  }

  /**
   * Get domains for tenant
   */
  async getTenantDomains(organizationId: string): Promise<DomainMappingResult[]> {
    const domains = await this.prisma.domainMapping.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: { isPrimary: 'desc' },
    });

    return domains.map(d => this.mapToDomainResult(d));
  }

  /**
   * Set primary domain
   */
  async setPrimaryDomain(organizationId: string, domainId: string): Promise<void> {
    // Verify domain exists
    const domain = await this.prisma.domainMapping.findUnique({
      where: { id: domainId },
    });

    if (!domain || domain.organizationId !== organizationId) {
      throw new NotFoundException('Domain not found');
    }

    // Remove primary from other domains
    await this.prisma.domainMapping.updateMany({
      where: {
        organizationId,
        isPrimary: true,
      },
      data: { isPrimary: false },
    });

    // Set this as primary
    await this.prisma.domainMapping.update({
      where: { id: domainId },
      data: { isPrimary: true },
    });

    this.logger.log(`Primary domain set: ${domainId} for tenant ${organizationId}`);
  }

  /**
   * Remove domain
   */
  async removeDomain(organizationId: string, domainId: string): Promise<void> {
    const domain = await this.prisma.domainMapping.findUnique({
      where: { id: domainId },
    });

    if (!domain || domain.organizationId !== organizationId) {
      throw new NotFoundException('Domain not found');
    }

    // Cannot remove primary domain
    if (domain.isPrimary) {
      throw new BadRequestException('Cannot remove primary domain. Set another domain as primary first.');
    }

    await this.prisma.domainMapping.update({
      where: { id: domainId },
      data: { isActive: false },
    });

    this.logger.log(`Domain removed: ${domainId} for tenant ${organizationId}`);
  }

  /**
   * Verify custom domain DNS
   */
  async verifyDomainDNS(organizationId: string, domainId: string): Promise<boolean> {
    const domain = await this.prisma.domainMapping.findUnique({
      where: { id: domainId },
    });

    if (!domain || domain.organizationId !== organizationId) {
      throw new NotFoundException('Domain not found');
    }

    if (!domain.dnsVerificationToken) {
      throw new BadRequestException('Domain is not pending DNS verification');
    }

    try {
      // In production, would query actual DNS records
      // For demo, assume verified after API call (implement real DNS check in production)
      const verified = await this.checkDNSRecord(
        domain.domain || domain.subdomain || '',
        domain.dnsVerificationToken,
      );

      if (verified) {
        await this.prisma.domainMapping.update({
          where: { id: domainId },
          data: {
            sslVerified: true,
            dnsVerificationToken: null,
          },
        });

        this.logger.log(`Domain verified: ${domain.domain || domain.subdomain}`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`DNS verification failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Helper: Check DNS record
   */
  private async checkDNSRecord(domain: string, token: string): Promise<boolean> {
    // This is a placeholder. In production, use DNS lookup library
    // For now, simulate with a log message
    this.logger.log(`Checking DNS for ${domain} with token ${token.substring(0, 10)}...`);
    return true;
  }

  /**
   * Validate subdomain format
   */
  private isValidSubdomain(subdomain: string): boolean {
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
    return (
      subdomainRegex.test(subdomain) &&
      subdomain.length >= 3 &&
      subdomain.length <= 63
    );
  }

  /**
   * Check if subdomain is reserved
   */
  private isReservedSubdomain(subdomain: string): boolean {
    const reserved = [
      'www',
      'mail',
      'admin',
      'api',
      'auth',
      'docs',
      'blog',
      'status',
      'support',
      'staging',
      'dev',
      'test',
      'ftp',
      'smtp',
      'imap',
      'pop',
      'calendar',
      'files',
      'drive',
      'download',
      'upload',
      'cdn',
      'static',
      'assets',
      'images',
      'videos',
      'media',
      'app',
      'dashboard',
      'console',
      'iam',
      'oauth',
      'sso',
      'billing',
      'payments',
      'invoice',
      'webhook',
      '_dmarc',
      '_acme-challenge',
    ];

    return reserved.includes(subdomain.toLowerCase());
  }

  /**
   * Validate domain format
   */
  private isValidDomain(domain: string): boolean {
    // Basic domain validation
    const domainRegex =
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

    // Don't allow base domain
    if (domain === this.baseDomain) {
      return false;
    }

    // Don't allow subdomains of base domain (those go through addSubdomain)
    if (domain.endsWith('.' + this.baseDomain)) {
      return false;
    }

    return domainRegex.test(domain);
  }

  /**
   * Generate DNS verification token
   */
  private generateVerificationToken(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Map domain entity to result
   */
  private mapToDomainResult(domain: any): DomainMappingResult {
    return {
      id: domain.id,
      domain: domain.domain,
      subdomain: domain.subdomain,
      domainType: domain.domainType,
      isPrimary: domain.isPrimary,
      isActive: domain.isActive,
      sslVerified: domain.sslVerified ?? domain.dnsVerified ?? false,
      dnsVerificationToken: domain.dnsVerificationToken,
      dnsVerificationRecord: domain.dnsVerificationRecord ?? domain.dnsCnameRecord,
      redirectUrl: domain.redirectUrl ?? domain.redirectTo,
      createdAt: domain.createdAt,
    };
  }
}
