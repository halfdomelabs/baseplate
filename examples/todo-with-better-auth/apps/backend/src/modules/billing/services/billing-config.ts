/**
 * Billing plan configuration.
 *
 * Maps internal plan keys to their granted roles and Stripe Price IDs.
 * Replace placeholder Price IDs with your actual Stripe Price IDs.
 */
export const SUBSCRIPTION_PLANS = {
  'pro-plan': {
    grantedRoles: ['PRO_USER'] as const,
    priceId: 'price_PLACEHOLDER', // Replace with your Stripe Price ID
  },
} as const;

/** A valid plan key from the billing configuration. */
export type PlanKey = keyof typeof SUBSCRIPTION_PLANS;
