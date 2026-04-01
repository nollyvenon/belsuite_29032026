import { SetMetadata } from '@nestjs/common';
import { SubscriptionTier } from '@prisma/client';

export const REQUIRE_PLAN_KEY = 'require-plan';

export interface RequirePlanOptions {
  minimumTier?: SubscriptionTier;
  requirePaidPlan?: boolean;
  requireActiveSubscription?: boolean;
}

export const RequirePlan = (options: RequirePlanOptions) =>
  SetMetadata(REQUIRE_PLAN_KEY, options);