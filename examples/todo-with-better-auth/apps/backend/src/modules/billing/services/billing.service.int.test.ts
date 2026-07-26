/* eslint-disable @typescript-eslint/unbound-method */
import type Stripe from 'stripe';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@src/services/prisma.js';
import { createMockLogger } from '@src/tests/helpers/logger.test-helper.js';

vi.mock('@src/services/error-logger.js', () => ({
  logError: vi.fn(),
}));
vi.mock('@src/services/logger.js', () => ({
  logger: createMockLogger(),
}));

const stripe = {
  customers: { create: vi.fn() },
  subscriptions: { update: vi.fn().mockResolvedValue({}) },
  webhooks: { constructEventAsync: vi.fn() },
} as unknown as Stripe;

import {
  createBillingService,
  MissingBillingAccountError,
  MissingSubscriptionItemError,
  UnresolvedPlanKeyError,
} from './billing.service.js';

const TEST_CUSTOMER_ID = 'cus_test_123';
const TEST_SUBSCRIPTION_ID = 'sub_test_456';

/** Creates a test user with a linked billing account. */
async function createTestUserWithBillingAccount(): Promise<{
  userId: string;
  billingAccountId: string;
}> {
  const user = await prisma.user.create({
    data: {
      name: 'Test User',
      email: `test-billing-${Date.now()}@example.com`,
      billingAccount: {
        create: { stripeCustomerId: TEST_CUSTOMER_ID },
      },
    },
    include: { billingAccount: true },
  });

  if (!user.billingAccount) {
    throw new Error('BillingAccount was not created');
  }

  return {
    userId: user.id,
    billingAccountId: user.billingAccount.id,
  };
}

function createFakeSubscription(
  overrides?: Partial<Stripe.Subscription>,
): Stripe.Subscription {
  return {
    id: TEST_SUBSCRIPTION_ID,
    object: 'subscription',
    customer: TEST_CUSTOMER_ID,
    status: 'active',
    cancel_at_period_end: false,
    metadata: { planKey: 'pro-plan' },
    items: {
      object: 'list',
      data: [
        {
          id: 'si_test',
          object: 'subscription_item',
          price: { id: 'price_PLACEHOLDER_STAGE_PRO_PLAN' },
          current_period_start: 1_700_000_000,
          current_period_end: 1_702_592_000,
        } as unknown as Stripe.SubscriptionItem,
      ],
      has_more: false,
      url: '',
    },
    ...overrides,
  } as Stripe.Subscription;
}

describe('billing.service', () => {
  const billingService = createBillingService({ stripe });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(stripe.subscriptions.update).mockResolvedValue({} as never);
  });

  afterEach(async () => {
    await prisma.billingSubscription.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.billingAccount.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('handleSubscriptionEvent', () => {
    it('throws on unexpected event types', async () => {
      const event = {
        type: 'charge.succeeded',
        data: { object: {} },
      } as Stripe.Event;

      await expect(
        billingService.handleSubscriptionEvent(event),
      ).rejects.toThrow('Unexpected event type for subscription handler');
    });

    it('processes valid subscription events end-to-end', async () => {
      await createTestUserWithBillingAccount();

      const subscription = createFakeSubscription();
      const event = {
        type: 'customer.subscription.created',
        data: { object: subscription },
      } as Stripe.Event;

      await billingService.handleSubscriptionEvent(event);

      const dbSubscription = await prisma.billingSubscription.findUnique({
        where: { stripeSubscriptionId: TEST_SUBSCRIPTION_ID },
      });
      expect(dbSubscription).toBeTruthy();
      expect(dbSubscription?.status).toBe('ACTIVE');
    });

    it('creates a subscription and grants roles', async () => {
      const { userId } = await createTestUserWithBillingAccount();

      await billingService.handleSubscriptionEvent({
        type: 'customer.subscription.created',
        data: { object: createFakeSubscription() },
      } as Stripe.Event);

      const subscription = await prisma.billingSubscription.findUnique({
        where: { stripeSubscriptionId: TEST_SUBSCRIPTION_ID },
      });
      expect(subscription).toMatchObject({
        planKey: 'pro-plan',
        status: 'ACTIVE',
      });

      const roles = await prisma.userRole.findMany({
        where: { userId },
      });
      expect(roles).toEqual(
        expect.arrayContaining([expect.objectContaining({ role: 'pro-user' })]),
      );
    });

    it('removes roles when subscription is canceled', async () => {
      const { userId } = await createTestUserWithBillingAccount();

      await billingService.handleSubscriptionEvent({
        type: 'customer.subscription.created',
        data: { object: createFakeSubscription() },
      } as Stripe.Event);

      const rolesBefore = await prisma.userRole.findMany({
        where: { userId, role: 'pro-user' },
      });
      expect(rolesBefore).toHaveLength(1);

      await billingService.handleSubscriptionEvent({
        type: 'customer.subscription.updated',
        data: {
          object: createFakeSubscription({
            id: TEST_SUBSCRIPTION_ID,
            status: 'canceled',
          }),
        },
      } as Stripe.Event);

      const subscription = await prisma.billingSubscription.findUnique({
        where: { stripeSubscriptionId: TEST_SUBSCRIPTION_ID },
      });
      expect(subscription?.status).toBe('CANCELED');

      const rolesAfter = await prisma.userRole.findMany({
        where: { userId, role: 'pro-user' },
      });
      expect(rolesAfter).toHaveLength(0);
    });

    it('is idempotent when synced twice with the same status', async () => {
      await createTestUserWithBillingAccount();

      const event = {
        type: 'customer.subscription.created',
        data: { object: createFakeSubscription() },
      } as Stripe.Event;

      await billingService.handleSubscriptionEvent(event);
      await billingService.handleSubscriptionEvent(event);

      const subscriptions = await prisma.billingSubscription.findMany();
      expect(subscriptions).toHaveLength(1);
    });

    it('keeps roles for PAST_DUE status', async () => {
      const { userId } = await createTestUserWithBillingAccount();

      await billingService.handleSubscriptionEvent({
        type: 'customer.subscription.created',
        data: { object: createFakeSubscription() },
      } as Stripe.Event);

      await billingService.handleSubscriptionEvent({
        type: 'customer.subscription.updated',
        data: { object: createFakeSubscription({ status: 'past_due' }) },
      } as Stripe.Event);

      const roles = await prisma.userRole.findMany({
        where: { userId, role: 'pro-user' },
      });
      expect(roles).toHaveLength(1);
    });

    it('keeps roles granted by a second active subscription on the same account', async () => {
      // A billing account can have more than one subscription row (e.g. an
      // old canceled one alongside a new active one). Reconciliation must
      // consider all of them, not just the subscription in the current
      // event - otherwise canceling one subscription could wrongly revoke
      // roles still granted by another active subscription on the account.
      const { userId, billingAccountId } =
        await createTestUserWithBillingAccount();

      await billingService.handleSubscriptionEvent({
        type: 'customer.subscription.created',
        data: { object: createFakeSubscription() },
      } as Stripe.Event);

      // A second, unrelated active subscription on the same account.
      const SECOND_SUBSCRIPTION_ID = 'sub_test_789';
      await prisma.billingSubscription.create({
        data: {
          billingAccountId,
          planKey: 'pro-plan',
          status: 'ACTIVE',
          stripeSubscriptionId: SECOND_SUBSCRIPTION_ID,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(),
          cancelAtPeriodEnd: false,
        },
      });

      // Cancel only the first subscription.
      await billingService.handleSubscriptionEvent({
        type: 'customer.subscription.updated',
        data: {
          object: createFakeSubscription({
            id: TEST_SUBSCRIPTION_ID,
            status: 'canceled',
          }),
        },
      } as Stripe.Event);

      const roles = await prisma.userRole.findMany({
        where: { userId, role: 'pro-user' },
      });
      expect(roles).toHaveLength(1);
    });

    it('throws when no billing account is found for the Stripe customer', async () => {
      await expect(
        billingService.handleSubscriptionEvent({
          type: 'customer.subscription.created',
          data: {
            object: createFakeSubscription({ customer: 'cus_nonexistent' }),
          },
        } as Stripe.Event),
      ).rejects.toThrow(MissingBillingAccountError);

      const subscriptions = await prisma.billingSubscription.findMany();
      expect(subscriptions).toHaveLength(0);
    });

    it('throws when the subscription has no items', async () => {
      await createTestUserWithBillingAccount();

      await expect(
        billingService.handleSubscriptionEvent({
          type: 'customer.subscription.created',
          data: {
            object: createFakeSubscription({
              items: { object: 'list', data: [], has_more: false, url: '' },
            }),
          },
        } as Stripe.Event),
      ).rejects.toThrow(MissingSubscriptionItemError);
    });

    it('throws when the plan key cannot be resolved', async () => {
      await createTestUserWithBillingAccount();

      await expect(
        billingService.handleSubscriptionEvent({
          type: 'customer.subscription.created',
          data: {
            object: createFakeSubscription({
              metadata: {},
              items: {
                object: 'list',
                data: [
                  {
                    id: 'si_test',
                    object: 'subscription_item',
                    price: { id: 'price_unknown' },
                    current_period_start: 1_700_000_000,
                    current_period_end: 1_702_592_000,
                  } as unknown as Stripe.SubscriptionItem,
                ],
                has_more: false,
                url: '',
              },
            }),
          },
        } as Stripe.Event),
      ).rejects.toThrow(UnresolvedPlanKeyError);
    });

    it('falls back to price ID lookup when metadata planKey is missing', async () => {
      await createTestUserWithBillingAccount();

      await billingService.handleSubscriptionEvent({
        type: 'customer.subscription.created',
        data: { object: createFakeSubscription({ metadata: {} }) },
      } as Stripe.Event);

      const subscription = await prisma.billingSubscription.findUnique({
        where: { stripeSubscriptionId: TEST_SUBSCRIPTION_ID },
      });
      expect(subscription?.planKey).toBe('pro-plan');

      expect(stripe.subscriptions.update).toHaveBeenCalledWith(
        TEST_SUBSCRIPTION_ID,
        { metadata: { planKey: 'pro-plan' } },
      );
    });
  });

  describe('getOrCreateAccount', () => {
    it('returns the existing billing account without calling Stripe', async () => {
      const { userId, billingAccountId } =
        await createTestUserWithBillingAccount();

      const account = await billingService.getOrCreateAccount(userId);

      expect(account.id).toBe(billingAccountId);
      expect(stripe.customers.create).not.toHaveBeenCalled();
    });

    it('creates a Stripe customer and billing account with an idempotency key', async () => {
      const user = await prisma.user.create({
        data: { name: 'New User', email: `new-user-${Date.now()}@example.com` },
      });
      vi.mocked(stripe.customers.create).mockResolvedValue({
        id: 'cus_new_123',
      } as unknown as Stripe.Response<Stripe.Customer>);

      const account = await billingService.getOrCreateAccount(user.id);

      expect(account.stripeCustomerId).toBe('cus_new_123');
      expect(stripe.customers.create).toHaveBeenCalledWith(
        { email: user.email, metadata: { userId: user.id } },
        { idempotencyKey: `billing-account:${user.id}` },
      );
    });

    it('recovers by re-fetching when a concurrent call already created the account', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Race User',
          email: `race-user-${Date.now()}@example.com`,
        },
      });
      vi.mocked(stripe.customers.create).mockResolvedValue({
        id: 'cus_race_123',
      } as unknown as Stripe.Response<Stripe.Customer>);

      // Simulate a concurrent winner: the account is created and linked to
      // the user between this call's read and its own insert attempt.
      const winningAccount = await prisma.billingAccount.create({
        data: {
          stripeCustomerId: 'cus_race_winner',
          user: { connect: { id: user.id } },
        },
      });

      const account = await billingService.getOrCreateAccount(user.id);

      expect(account.id).toBe(winningAccount.id);
    });
  });
});
