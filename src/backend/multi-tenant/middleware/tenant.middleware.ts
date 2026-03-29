/**
 * Tenant Middleware
 * Resolves tenant (Organization) from request subdomain, domain, or header
 * Attaches tenant context to request
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../database/prisma.service';

declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        slug: string;
        name: string;
        tier: string;
        organizationId: string;
      };
      tenantId?: string;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const host = req.hostname;
      const xTenantHeader = req.headers['x-tenant-id'] as string;

      let organizationId: string | null = null;

      // 1. Try to resolve from X-Tenant-Id header (for API calls)
      if (xTenantHeader) {
        organizationId = await this.resolveFromHeader(xTenantHeader);
        if (organizationId) {
          this.logger.debug(`Tenant resolved from header: ${organizationId}`);
        }
      }

      // 2. Try to resolve from hostname (subdomain or custom domain)
      if (!organizationId) {
        organizationId = await this.resolveFromHostname(host);
        if (organizationId) {
          this.logger.debug(`Tenant resolved from hostname: ${host} → ${organizationId}`);
        }
      }

      // 3. Try to resolve from pathname (legacy: /org/:slug)
      if (!organizationId) {
        organizationId = await this.resolveFromPath(req.path);
      }

      // If tenant found, attach to request
      if (organizationId) {
        const organization = await this.prisma.organization.findUnique({
          where: { id: organizationId },
          select: {
            id: true,
            slug: true,
            name: true,
            tier: true,
          },
        });

        if (organization) {
          req.tenant = {
            id: organization.id,
            slug: organization.slug,
            name: organization.name,
            tier: organization.tier,
            organizationId: organization.id,
          };
          req.tenantId = organization.id;

          this.logger.debug(`Tenant attached to request: ${organization.slug}`);
        }
      }

      next();
    } catch (error) {
      this.logger.error(`Tenant resolution error: ${error.message}`, error.stack);
      // Continue anyway - some routes don't require tenant
      next();
    }
  }

  /**
   * Resolve tenant from X-Tenant-Id header
   */
  private async resolveFromHeader(tenantId: string): Promise<string | null> {
    try {
      const org = await this.prisma.organization.findUnique({
        where: { id: tenantId },
        select: { id: true },
      });
      return org?.id || null;
    } catch {
      return null;
    }
  }

  /**
   * Resolve tenant from hostname (subdomain or custom domain)
   *
   * Examples:
   * - acme.belsuite.com → lookup via DomainMapping.subdomain
   * - acme.com → lookup via DomainMapping.domain
   * - api.staging.belsuite.com → strip api prefix, resolve staging
   */
  private async resolveFromHostname(hostname: string): Promise<string | null> {
    try {
      // Remove port if present
      const host = hostname.split(':')[0].toLowerCase();

      // Skip localhost and common service hostnames
      if (this.isSystemHostname(host)) {
        return null;
      }

      // Try to resolve as subdomain (acme.belsuite.com)
      const baseDomain = process.env.BELSUITE_BASE_DOMAIN || 'belsuite.com';
      if (host.endsWith('.' + baseDomain)) {
        const subdomain = host.split('.')[0]; // Get 'acme' from 'acme.belsuite.com'

        // Skip api, www, mail subdomains
        if (['api', 'www', 'mail', 'admin', 'staging', 'dev'].includes(subdomain)) {
          return null;
        }

        const domain = await this.prisma.domainMapping.findUnique({
          where: { subdomain },
          select: { organizationId: true },
        });

        if (domain) {
          return domain.organizationId;
        }
      }

      // Try to resolve as custom domain
      const customDomain = await this.prisma.domainMapping.findUnique({
        where: { domain: host },
        select: { organizationId: true },
      });

      if (customDomain) {
        return customDomain.organizationId;
      }

      return null;
    } catch (error) {
      this.logger.warn(`Failed to resolve hostname: ${hostname}`, error);
      return null;
    }
  }

  /**
   * Resolve tenant from URL path
   *
   * Examples:
   * - /org/acme/* → resolve 'acme' slug
   * - /tenants/acme/* → resolve 'acme' slug
   */
  private async resolveFromPath(path: string): Promise<string | null> {
    try {
      const patterns = [
        /^\/org\/([a-z0-9-]+)/i,
        /^\/tenants\/([a-z0-9-]+)/i,
        /^\/([a-z0-9-]+)/, // First segment could be slug
      ];

      for (const pattern of patterns) {
        const match = path.match(pattern);
        if (match && match[1]) {
          const slug = match[1];

          // Skip common API paths
          if (['api', 'auth', 'health', 'metrics'].includes(slug)) {
            continue;
          }

          const org = await this.prisma.organization.findUnique({
            where: { slug },
            select: { id: true },
          });

          if (org) {
            return org.id;
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if hostname is a system hostname (not a tenant)
   */
  private isSystemHostname(host: string): boolean {
    const systemHosts = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      'belsuite.com',
      process.env.BELSUITE_BASE_DOMAIN || 'belsuite.com',
    ];

    const baseDomain = process.env.BELSUITE_BASE_DOMAIN || 'belsuite.com';
    const onlySystemSubdomains = ['api', 'www', 'mail', 'admin', 'auth', 'health', 'docs'];

    // Check system hosts
    if (systemHosts.includes(host)) {
      return true;
    }

    // Check if it's a system subdomain of base domain
    if (host.endsWith('.' + baseDomain)) {
      const subdomain = host.split('.')[0];
      if (onlySystemSubdomains.includes(subdomain)) {
        return true;
      }
    }

    return false;
  }
}
