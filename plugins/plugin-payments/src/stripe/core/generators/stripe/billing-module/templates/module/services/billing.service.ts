// @ts-nocheck

import type { PlanKey } from '$billingConfig';
import type {
  BillingAccount,
  BillingSubscriptionStatus,
} from '%prismaGeneratedImports';
import type Stripe from 'stripe';

import { getPriceId, SUBSCRIPTION_PLANS } from '$billingConfig';
import { logError } from '%errorHandlerServiceImports';
import { logger } from '%loggerServiceImports';
import { Prisma } from '%prismaGeneratedImports';
import { prisma } from '%prismaImports';

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

/** Statuses that indicate a subscription is currently active. */
const ACTIVE_STATUSES: ReadonlySet<BillingSubscriptionStatus> = new Set([
  'ACTIVE',
  'TRIALING',
  'PAST_DUE',
]);

/** Every role any configured plan can grant, i.e. the roles this service manages. */
const MANAGED_ROLES: ReadonlySet<string> = new Set(
  Object.values(SUBSCRIPTION_PLANS).flatMap((plan) => plan.grantedRoles),
);

/**
 * Reconciles a user's plan-granted roles against ALL of their billing
 * account's subscriptions (not just the subscription that triggered this
 * event) - a billing account can have more than one subscription row (e.g.
 * an old canceled one alongside a new active one), so diffing a single
 * event's before/after status misses plan-to-plan changes and can revoke
 * roles a different, unrelated active subscription still grants. Idempotent
 * and order-insensitive: safe to call on every sync regardless of which
 * field changed.
 *
 * @param userId - The user whose roles to reconcile.
 * @param subscriptions - Every subscription on the user's billing account.
 */
async function reconcileSubscriptionRoles(
  userId: string,
  subscriptions: { planKey: string; status: BillingSubscriptionStatus }[],
): Promise<void> {
  const desiredRoles = new Set<string>();
  for (const subscription of subscriptions) {
    if (!ACTIVE_STATUSES.has(subscription.status)) {
      continue;
    }
    const plan = SUBSCRIPTION_PLANS[subscription.planKey as PlanKey] as
      | (typeof SUBSCRIPTION_PLANS)[PlanKey]
      | undefined;
    if (!plan) {
      logger.warn(
        `Unknown plan key "${subscription.planKey}" while reconciling roles for user ${userId}`,
      );
      continue;
    }
    for (const role of plan.grantedRoles) {
      desiredRoles.add(role);
    }
  }

  const rolesToRevoke = [...MANAGED_ROLES].filter(
    (role) => !desiredRoles.has(role),
  );

  if (desiredRoles.size > 0) {
    await prisma.userRole.createMany({
      data: [...desiredRoles].map((role) => ({ userId, role })),
      skipDuplicates: true,
    });
  }
  if (rolesToRevoke.length > 0) {
    await prisma.userRole.deleteMany({
      where: { userId, role: { in: rolesToRevoke } },
    });
  }
}

/** A webhook event referenced a Stripe customer with no matching {@link BillingAccount}. */
export class MissingBillingAccountError extends Error {
  constructor(customerProviderId: string) {
    super(`No BillingAccount found for Stripe customer: ${customerProviderId}`);
    this.name = 'MissingBillingAccountError';
  }
}

/** A Stripe subscription event carried no subscription items. */
export class MissingSubscriptionItemError extends Error {
  constructor(subscriptionId: string) {
    super(
      `No subscription items found for Stripe subscription: ${subscriptionId}`,
    );
    this.name = 'MissingSubscriptionItemError';
  }
}

/** Neither Stripe metadata nor price ID matched a configured plan. */
export class UnresolvedPlanKeyError extends Error {
  constructor(subscriptionId: string) {
    super(
      `Could not resolve plan key for Stripe subscription: ${subscriptionId}`,
    );
    this.name = 'UnresolvedPlanKeyError';
  }
}

/**
 * The application-facing billing capability: provisioning billing accounts
 * and syncing subscription state from Stripe webhook events.
 */
export interface BillingService {
  /**
   * Gets or creates a {@link BillingAccount} for the given user, creating a
   * Stripe customer if one doesn't already exist.
   *
   * @param userId - The user ID to get or create a billing account for.
   * @returns The BillingAccount record.
   */
  getOrCreateAccount(userId: string): Promise<BillingAccount>;
  /**
   * Handles a Stripe subscription event by syncing the subscription data and
   * reconciling the user's plan roles.
   *
   * @param event - A generic Stripe event (type-checked at runtime).
   */
  handleSubscriptionEvent(event: Stripe.Event): Promise<void>;
}

/**
 * Creates the {@link BillingService}. Construction allocates no resources -
 * `stripe` is an already-constructed, passive client.
 *
 * @param deps - Construction dependencies
 * @param deps.stripe - The Stripe client.
 * @returns The billing service
 */
export function createBillingService({
  stripe,
}: {
  stripe: Stripe;
}): BillingService {
  /**
   * Gets or creates a BillingAccount for the given user.
   *
   * Looks up the user's existing billingAccountId. If found, returns the
   * account. Otherwise, creates a new Stripe customer (idempotent per user
   * via a stable idempotency key) and BillingAccount record, and links it
   * back to the user. If a concurrent call already won the race to create
   * the account, recovers by re-fetching the winning row rather than
   * failing - the idempotency key only dedupes near-simultaneous Stripe
   * calls within Stripe's ~24h window, so the database's unique constraint
   * on `User.billingAccountId` is the durable guard against a duplicate
   * link (a second Stripe customer may still be created if two calls race
   * outside the idempotency window; that residual is accepted rather than
   * solved here).
   */
  async function getOrCreateAccount(userId: string): Promise<BillingAccount> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true, billingAccount: true },
    });

    if (user.billingAccount) {
      return user.billingAccount;
    }

    const stripeCustomer = await stripe.customers.create(
      { email: user.email, metadata: { userId } },
      { idempotencyKey: `billing-account:${userId}` },
    );

    try {
      return await prisma.billingAccount.create({
        data: {
          stripeCustomerId: stripeCustomer.id,
          user: { connect: { id: userId } },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const { billingAccount } = await prisma.user.findUniqueOrThrow({
          where: { id: userId },
          select: { billingAccount: true },
        });
        if (billingAccount) {
          return billingAccount;
        }
      }
      throw error;
    }
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
   * Failures to resolve the account, subscription item, or plan key throw
   * rather than silently returning, so Stripe retries the webhook instead of
   * the local database permanently diverging from Stripe's state.
   *
   * @param stripeSubscription - The Stripe subscription object from a webhook event.
   */
  async function syncSubscriptionFromStripe(
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
      throw new MissingBillingAccountError(customerProviderId);
    }

    const firstItem = stripeSubscription.items.data.at(0);
    if (!firstItem) {
      throw new MissingSubscriptionItemError(stripeSubscription.id);
    }

    const resolvedPlanKey = resolvePlanKey(stripeSubscription, firstItem);

    if (!resolvedPlanKey) {
      throw new UnresolvedPlanKeyError(stripeSubscription.id);
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

    const user = await prisma.billingAccount
      .findUnique({ where: { id: billingAccount.id } })
      .user();

    if (user) {
      const accountSubscriptions = await prisma.billingSubscription.findMany({
        where: { billingAccountId: billingAccount.id },
        select: { planKey: true, status: true },
      });
      await reconcileSubscriptionRoles(user.id, accountSubscriptions);
    }
  }

  /**
   * Handles a Stripe subscription event by syncing the subscription data.
   *
   * Validates the event type at runtime before narrowing to a subscription event.
   *
   * @param event - A generic Stripe event (type-checked at runtime).
   */
  async function handleSubscriptionEvent(event: Stripe.Event): Promise<void> {
    if (
      event.type !== 'customer.subscription.created' &&
      event.type !== 'customer.subscription.updated' &&
      event.type !== 'customer.subscription.deleted'
    ) {
      throw new Error(
        `Unexpected event type for subscription handler: ${event.type}`,
      );
    }

    const subscription = event.data.object;
    logger.info(`Processing ${event.type} for subscription ${subscription.id}`);
    await syncSubscriptionFromStripe(subscription);
  }

  return { getOrCreateAccount, handleSubscriptionEvent };
}
