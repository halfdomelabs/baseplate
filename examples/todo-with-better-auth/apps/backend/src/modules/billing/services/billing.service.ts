import type Stripe from 'stripe';

import type {
  BillingAccount,
  BillingSubscriptionStatus,
} from '@src/generated/prisma/client.js';

import { logError } from '@src/services/error-logger.js';
import { logger } from '@src/services/logger.js';
import { prisma } from '@src/services/prisma.js';
import { stripe } from '@src/services/stripe.js';

import type { PlanKey } from './billing-config.js';

import { getPriceId, SUBSCRIPTION_PLANS } from './billing-config.js';

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
  paused: 'PAUSED',
};

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
 * Resolves the plan key for a Stripe subscription.
 *
 * Tries metadata.planKey first (authoritative). If missing, falls back to
 * reverse-looking up the plan by the subscription item's price ID. When a
 * price ID match is found but metadata was missing, auto-heals the Stripe
 * subscription metadata so future webhooks resolve immediately.
 *
 * @param stripeSubscription - The Stripe subscription object.
 * @param firstItem - The first subscription item.
 * @returns The resolved plan key, or undefined if no plan could be identified.
 */
function resolvePlanKey(
  stripeSubscription: Stripe.Subscription,
  firstItem: Stripe.SubscriptionItem,
): PlanKey | undefined {
  const metadataPlanKey = stripeSubscription.metadata.planKey;

  if (metadataPlanKey && metadataPlanKey in SUBSCRIPTION_PLANS) {
    return metadataPlanKey as PlanKey;
  }

  if (metadataPlanKey) {
    logger.warn(
      `Unknown plan key "${metadataPlanKey}" in metadata for subscription: ${stripeSubscription.id}`,
    );
  }

  const priceId = firstItem.price.id;
  const pricePlanKey = (Object.keys(SUBSCRIPTION_PLANS) as PlanKey[]).find(
    (key) => getPriceId(key) === priceId,
  );

  if (!pricePlanKey) {
    return undefined;
  }

  logger.info(
    `Resolved plan key "${pricePlanKey}" from price ID "${priceId}" for subscription: ${stripeSubscription.id}`,
  );

  // Auto-heal: attach planKey to Stripe metadata so future webhooks resolve immediately
  stripe.subscriptions
    .update(stripeSubscription.id, {
      metadata: { planKey: pricePlanKey },
    })
    .catch((err: unknown) => {
      logError(err);
    });

  return pricePlanKey;
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

  const firstItem = stripeSubscription.items.data.at(0);
  if (!firstItem) {
    logError(
      new Error(
        `No subscription items found for Stripe subscription: ${stripeSubscription.id}`,
      ),
    );
    return;
  }

  const resolvedPlanKey = resolvePlanKey(stripeSubscription, firstItem);

  if (!resolvedPlanKey) {
    logger.warn(
      `Could not resolve plan key for Stripe subscription: ${stripeSubscription.id}`,
    );
    return;
  }

  const currentPeriodStart = new Date(firstItem.current_period_start * 1000);
  const currentPeriodEnd = new Date(firstItem.current_period_end * 1000);

  await prisma.billingSubscription.upsert({
    where: { stripeSubscriptionId: stripeSubscription.id },
    create: {
      billingAccountId: billingAccount.id,
      planKey: resolvedPlanKey,
      status,
      stripeSubscriptionId: stripeSubscription.id,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
    update: {
      planKey: resolvedPlanKey,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  });
}

/** Stripe event types that carry a subscription object. */
type SubscriptionEvent =
  | Stripe.CustomerSubscriptionCreatedEvent
  | Stripe.CustomerSubscriptionUpdatedEvent
  | Stripe.CustomerSubscriptionDeletedEvent;

/**
 * Handles a Stripe subscription event by syncing the subscription data.
 *
 * @param event - A Stripe subscription lifecycle event.
 */
export async function handleSubscriptionEvent(
  event: SubscriptionEvent,
): Promise<void> {
  const subscription = event.data.object;
  logger.info(`Processing ${event.type} for subscription ${subscription.id}`);
  await syncSubscriptionFromStripe(subscription);
}
