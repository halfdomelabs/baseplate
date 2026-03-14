import type Stripe from 'stripe';

import type {
  BillingAccount,
  BillingSubscriptionStatus,
} from '../../../generated/prisma/client.js';

import { logError } from '../../../services/error-logger.js';
import { logger } from '../../../services/logger.js';
import { prisma } from '../../../services/prisma.js';
import { stripe } from '../../../services/stripe.js';
import { SUBSCRIPTION_PLANS } from './billing-config.js';

/** Maps Stripe subscription status strings to our BillingSubscriptionStatus enum. */
const STRIPE_STATUS_MAP: Record<
  Stripe.Subscription.Status,
  BillingSubscriptionStatus
> = {
  active: 'ACTIVE',
  trialing: 'TRIALING',
  past_due: 'PAST_DUE',
  canceled: 'CANCELED',
  unpaid: 'UNPAID',
  incomplete: 'INCOMPLETE',
  incomplete_expired: 'INCOMPLETE_EXPIRED',
  paused: 'INCOMPLETE',
};

/** Statuses that indicate a subscription is currently active. */
const ACTIVE_STATUSES: ReadonlySet<BillingSubscriptionStatus> = new Set([
  'ACTIVE',
  'TRIALING',
]);

/**
 * Checks whether a subscription status represents an active subscription.
 *
 * @param status - The subscription status to check.
 * @returns True if the status is ACTIVE or TRIALING.
 */
export function isSubscriptionActive(
  status: BillingSubscriptionStatus,
): boolean {
  return ACTIVE_STATUSES.has(status);
}

/**
 * Gets or creates a BillingAccount for the given user.
 *
 * Looks up the user's existing billingAccountId. If found, returns the account.
 * Otherwise, creates a new Stripe customer and BillingAccount record, and links
 * it back to the user.
 *
 * @param userId - The user ID to get or create a billing account for.
 * @returns The BillingAccount record.
 */
export async function getOrCreateBillingAccount(
  userId: string,
): Promise<BillingAccount> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true, billingAccount: true },
  });

  if (user.billingAccount) {
    return user.billingAccount;
  }

  const stripeCustomer = await stripe.customers.create({
    email: user.email,
    metadata: { userId },
  });

  const billingAccount = await prisma.billingAccount.create({
    data: {
      stripeCustomerId: stripeCustomer.id,
      user: { connect: { id: userId } },
    },
  });

  return billingAccount;
}

/**
 * Syncs a Stripe subscription to the database.
 *
 * Uses the Stripe subscription ID (providerId) for idempotent upserts.
 * Translates Stripe status strings to our BillingSubscriptionStatus enum.
 *
 * @param stripeSubscription - The Stripe subscription object from a webhook event.
 */
export async function syncSubscriptionFromStripe(
  stripeSubscription: Stripe.Subscription,
): Promise<void> {
  const status = STRIPE_STATUS_MAP[stripeSubscription.status];

  const customerProviderId =
    typeof stripeSubscription.customer === 'string'
      ? stripeSubscription.customer
      : stripeSubscription.customer.id;

  const billingAccount = await prisma.billingAccount.findUnique({
    where: { stripeCustomerId: customerProviderId },
  });

  if (!billingAccount) {
    logger.warn(
      `No BillingAccount found for Stripe customer: ${customerProviderId}`,
    );
    return;
  }

  const { planKey } = stripeSubscription.metadata;

  if (!planKey) {
    logger.warn(
      `No plan key found for Stripe subscription: ${stripeSubscription.id}`,
    );
    return;
  }

  if (!(planKey in SUBSCRIPTION_PLANS)) {
    logger.warn(
      `Unknown plan key "${planKey}" for Stripe subscription: ${stripeSubscription.id}`,
    );
    return;
  }

  const firstItem = stripeSubscription.items.data.at(0);
  if (!firstItem) {
    logError(
      new Error(
        `No subscription items found for Stripe subscription: ${stripeSubscription.id}`,
      ),
    );
    return;
  }

  const currentPeriodStart = new Date(firstItem.current_period_start * 1000);
  const currentPeriodEnd = new Date(firstItem.current_period_end * 1000);

  await prisma.billingSubscription.upsert({
    where: { stripeSubscriptionId: stripeSubscription.id },
    create: {
      billingAccountId: billingAccount.id,
      planKey,
      status,
      stripeSubscriptionId: stripeSubscription.id,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
    update: {
      planKey,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  });
}

/**
 * Handles a Stripe subscription event by syncing the subscription data.
 *
 * @param event - The Stripe event containing subscription data.
 */
export async function handleSubscriptionEvent(
  event: Stripe.Event,
): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  logger.info(
    `Processing ${event.type} for subscription ${subscription.id}`,
  );
  await syncSubscriptionFromStripe(subscription);
}
