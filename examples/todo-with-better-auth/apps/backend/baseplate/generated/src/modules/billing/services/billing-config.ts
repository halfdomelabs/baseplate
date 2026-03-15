import { config } from '@src/services/config.js';

/** Defines the shape of a subscription plan. */
interface SubscriptionPlan {
  /** Roles granted to the user when this plan is active. */
  grantedRoles?: readonly string[];
  /** Stripe Price IDs keyed by environment. Dev/test use the stage price ID. */
  priceIds: {
    stage: string;
    prod: string;
  };
}

/**
 * Billing plan configuration.
 *
 * Maps internal plan keys to their granted roles and environment-specific
 * Stripe Price IDs.
 */
export const SUBSCRIPTION_PLANS = /* TPL_PLANS:START */ {
  'pro-plan': {
    grantedRoles: ['pro-user'] as const,
    priceIds: {
      stage: 'price_PLACEHOLDER_STAGE_PRO_PLAN',
      prod: 'price_PLACEHOLDER_PROD_PRO_PLAN',
    },
  },
} /* TPL_PLANS:END */ as const satisfies Record<string, SubscriptionPlan>;

/** A valid plan key from the billing configuration. */
export type PlanKey = keyof typeof SUBSCRIPTION_PLANS;

/**
 * Returns the Stripe Price ID for a plan based on the current environment.
 * Dev and test environments use the stage price ID.
 *
 * @param planKey - The plan key to look up.
 * @returns The Stripe Price ID for the current environment.
 */
export function getPriceId(planKey: PlanKey): string {
  const plan = SUBSCRIPTION_PLANS[planKey];
  const env = config.APP_ENVIRONMENT === 'prod' ? 'prod' : 'stage';
  return plan.priceIds[env];
}
