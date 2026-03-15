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

/** Reverse map from Stripe Price ID to plan key, built once at startup. */
const priceIdToPlanKey = new Map<string, PlanKey>(
  (
    Object.entries(SUBSCRIPTION_PLANS) as [
      PlanKey,
      (typeof SUBSCRIPTION_PLANS)[PlanKey],
    ][]
  ).map(([key, plan]) => [plan.priceId, key]),
);

/**
 * Looks up a plan key by its Stripe Price ID.
 *
 * @param priceId - The Stripe Price ID to look up.
 * @returns The matching plan key, or undefined if no plan matches.
 */
export function getPlanKeyByPriceId(priceId: string): PlanKey | undefined {
  return priceIdToPlanKey.get(priceId);
}
