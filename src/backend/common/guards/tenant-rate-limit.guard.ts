import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from '../../multi-tenant/services/rate-limit.service';

/**
 * Decorator to specify which resource type to rate-limit.
 * Usage: @RateLimit('API') or @RateLimit('EMAIL') or @RateLimit('AI_TOKENS', 500)
 */
export const RATE_LIMIT_KEY = 'rateLimit';
export interface RateLimitMeta {
  type: 'API' | 'EMAIL' | 'AI_TOKENS';
  amount?: number;
}
export const RateLimit = (type: RateLimitMeta['type'], amount = 1) =>
  SetMetadata(RATE_LIMIT_KEY, { type, amount });

/**
 * TenantRateLimitGuard
 * Enforces per-tenant rate limits before a request is handled.
 *
 * Apply globally or per-controller/route alongside @RateLimit() decorator.
 *
 * Example:
 *   @UseGuards(JwtAuthGuard, TenantRateLimitGuard)
 *   @RateLimit('API')
 *   @Get('data')
 *   getData() { ... }
 */
@Injectable()
export class TenantRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(TenantRateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.getAllAndOverride<RateLimitMeta>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @RateLimit() decorator — skip check
    if (!meta) return true;

    const request = context.switchToHttp().getRequest();
    const tenantId: string | undefined = request.tenantId ?? request.tenant?.id;

    // No tenant context (e.g. public route) — skip check
    if (!tenantId) return true;

    try {
      switch (meta.type) {
        case 'API':
          await this.rateLimitService.checkApiRequestLimit(tenantId);
          await this.rateLimitService.recordApiRequest(tenantId);
          break;

        case 'EMAIL':
          await this.rateLimitService.checkEmailLimit(tenantId);
          await this.rateLimitService.recordEmail(tenantId);
          break;

        case 'AI_TOKENS':
          await this.rateLimitService.checkAiTokenLimit(tenantId, meta.amount ?? 1);
          await this.rateLimitService.recordAiTokens(tenantId, meta.amount ?? 1);
          break;
      }
    } catch (error) {
      // Re-throw TooManyRequestsException from service; log other errors
      this.logger.warn(`Rate limit check failed for tenant ${tenantId}: ${error.message}`);
      throw error;
    }

    return true;
  }
}
