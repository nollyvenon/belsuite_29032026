import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionTier } from '@prisma/client';
import {
  REQUIRE_PLAN_KEY,
  RequirePlanOptions,
} from '../decorators/require-plan.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const TIER_ORDER: SubscriptionTier[] = [
  SubscriptionTier.FREE,
  SubscriptionTier.STARTER,
  SubscriptionTier.PROFESSIONAL,
  SubscriptionTier.ENTERPRISE,
];

@Injectable()
export class BillingEnforcementGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requirements = this.reflector.getAllAndOverride<RequirePlanOptions>(
      REQUIRE_PLAN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requirements) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const billingContext = request.billingContext;

    if (!billingContext) {
      throw new ForbiddenException('Billing context unavailable');
    }

    const effectiveTier = billingContext.effectiveTier as SubscriptionTier;
    const subscriptionStatus = billingContext.subscriptionStatus;
    const isPaidTier = effectiveTier !== SubscriptionTier.FREE;

    if (requirements.requirePaidPlan && !isPaidTier) {
      throw new ForbiddenException('This feature requires a paid plan');
    }

    if (requirements.minimumTier) {
      const currentIndex = TIER_ORDER.indexOf(effectiveTier);
      const requiredIndex = TIER_ORDER.indexOf(requirements.minimumTier);

      if (currentIndex < requiredIndex) {
        throw new ForbiddenException(
          `This feature requires the ${requirements.minimumTier.toLowerCase()} plan or higher`,
        );
      }
    }

    if (
      requirements.requireActiveSubscription &&
      subscriptionStatus &&
      !['ACTIVE', 'TRIAL'].includes(subscriptionStatus)
    ) {
      throw new ForbiddenException('Your subscription is not active');
    }

    return true;
  }
}