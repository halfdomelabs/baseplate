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
vi.mock('@src/services/stripe.js', () => ({
  stripe: {
    customers: { create: vi.fn() },
    subscriptions: { update: vi.fn().mockResolvedValue({}) },
    webhooks: { constructEventAsync: vi.fn() },
  },
}));

import { stripe } from '@src/services/stripe.js';

import {
  handleSubscriptionEvent,
  syncSubscriptionFromStripe,
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

  describe('syncSubscriptionFromStripe', () => {
    it('creates a subscription and grants roles', async () => {
      const { userId } = await createTestUserWithBillingAccount();

      await syncSubscriptionFromStripe(createFakeSubscription());

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
        expect.arrayContaining([
          expect.objectContaining({ role: 'PRO_USER' }),
        ]),
      );
    });

    it('removes roles when subscription is canceled', async () => {
      const { userId } = await createTestUserWithBillingAccount();

      // First sync — creates subscription and grants roles
      await syncSubscriptionFromStripe(createFakeSubscription());

      // Verify role was granted
      const rolesBefore = await prisma.userRole.findMany({
        where: { userId, role: 'PRO_USER' },
      });
      expect(rolesBefore).toHaveLength(1);

      // Cancel the subscription
      await syncSubscriptionFromStripe(
        createFakeSubscription({
          id: TEST_SUBSCRIPTION_ID,
          status: 'canceled',
        }),
      );

      const subscription = await prisma.billingSubscription.findUnique({
        where: { stripeSubscriptionId: TEST_SUBSCRIPTION_ID },
      });
      expect(subscription?.status).toBe('CANCELED');

      const rolesAfter = await prisma.userRole.findMany({
        where: { userId, role: 'PRO_USER' },
      });
      expect(rolesAfter).toHaveLength(0);
    });

    it('skips role sync when status has not changed', async () => {
      await createTestUserWithBillingAccount();

      // First sync
      await syncSubscriptionFromStripe(createFakeSubscription());

      // Second sync with same status — should be idempotent
      await syncSubscriptionFromStripe(createFakeSubscription());

      const subscriptions = await prisma.billingSubscription.findMany();
      expect(subscriptions).toHaveLength(1);
    });

    it('keeps roles for PAST_DUE status', async () => {
      const { userId } = await createTestUserWithBillingAccount();

      // Activate subscription
      await syncSubscriptionFromStripe(createFakeSubscription());

      // Transition to past_due
      await syncSubscriptionFromStripe(
        createFakeSubscription({ status: 'past_due' }),
      );

      const roles = await prisma.userRole.findMany({
        where: { userId, role: 'PRO_USER' },
      });
      expect(roles).toHaveLength(1);
    });

    it('returns early when no billing account found', async () => {
      // No user/billing account created
      await syncSubscriptionFromStripe(
        createFakeSubscription({ customer: 'cus_nonexistent' }),
      );

      const subscriptions = await prisma.billingSubscription.findMany();
      expect(subscriptions).toHaveLength(0);
    });

    it('falls back to price ID lookup when metadata planKey is missing', async () => {
      await createTestUserWithBillingAccount();

      await syncSubscriptionFromStripe(
        createFakeSubscription({ metadata: {} }),
      );

      const subscription = await prisma.billingSubscription.findUnique({
        where: { stripeSubscriptionId: TEST_SUBSCRIPTION_ID },
      });
      expect(subscription?.planKey).toBe('pro-plan');

      // Should auto-heal metadata
      expect(stripe.subscriptions.update).toHaveBeenCalledWith(
        TEST_SUBSCRIPTION_ID,
        { metadata: { planKey: 'pro-plan' } },
      );
    });
  });

  describe('handleSubscriptionEvent', () => {
    it('throws on unexpected event types', async () => {
      const event = {
        type: 'charge.succeeded',
        data: { object: {} },
      } as Stripe.Event;

      await expect(handleSubscriptionEvent(event)).rejects.toThrow(
        'Unexpected event type for subscription handler',
      );
    });

    it('processes valid subscription events end-to-end', async () => {
      await createTestUserWithBillingAccount();

      const subscription = createFakeSubscription();
      const event = {
        type: 'customer.subscription.created',
        data: { object: subscription },
      } as Stripe.Event;

      await handleSubscriptionEvent(event);

      const dbSubscription = await prisma.billingSubscription.findUnique({
        where: { stripeSubscriptionId: TEST_SUBSCRIPTION_ID },
      });
      expect(dbSubscription).toBeTruthy();
      expect(dbSubscription?.status).toBe('ACTIVE');
    });
  });
});
