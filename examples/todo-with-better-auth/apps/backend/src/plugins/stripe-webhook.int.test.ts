/* eslint-disable @typescript-eslint/unbound-method */
import type { Stripe } from 'stripe';

import Fastify, { type FastifyInstance } from 'fastify';
import rawBodyPlugin from 'fastify-raw-body';
import { describe, expect, it, vi } from 'vitest';

import { stripeWebhookPlugin } from '@src/plugins/stripe-webhook.js';

vi.mock('@src/services/config.js', () => ({
  config: {
    STRIPE_SECRET_KEY: 'sk_test_fake',
    STRIPE_ENDPOINT_SECRET: 'whsec_test_fake',
  },
}));

// The subscription-event handler queries the billing account; returning
// `null` exercises its "no matching billing account" early-return path
// without requiring a real database.
vi.mock('@src/services/prisma.js', () => ({
  prisma: {
    billingAccount: { findUnique: vi.fn().mockResolvedValue(null) },
  },
}));
vi.mock('@src/services/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

function createFakeSubscription(): Stripe.Subscription {
  return {
    id: 'sub_test_123',
    object: 'subscription',
    customer: 'cus_test_123',
    status: 'active',
    cancel_at_period_end: false,
    metadata: {},
    items: {
      object: 'list',
      data: [
        {
          id: 'si_test',
          object: 'subscription_item',
          price: { id: 'price_test' },
          current_period_start: 1_700_000_000,
          current_period_end: 1_702_592_000,
        } as unknown as Stripe.SubscriptionItem,
      ],
      has_more: false,
      url: '',
    },
  } as Stripe.Subscription;
}

function createFakeWebhookEvent(
  overrides?: Partial<Stripe.Event>,
): Stripe.Event {
  return {
    id: 'evt_test_123',
    object: 'event',
    api_version: '2025-03-31.basil',
    created: 1_642_600_000,
    livemode: false,
    pending_webhooks: 0,
    type: 'customer.subscription.created',
    request: null,
    data: {
      object: createFakeSubscription(),
    },
    ...overrides,
  } as Stripe.Event;
}

function createMockStripe(): Stripe {
  return {
    webhooks: {
      constructEventAsync: vi.fn(),
    },
  } as unknown as Stripe;
}

async function buildApp(stripe: Stripe): Promise<FastifyInstance> {
  const fastify = Fastify();
  await fastify.register(rawBodyPlugin, { global: false });
  await fastify.register(stripeWebhookPlugin, { services: { stripe } });
  return fastify;
}

describe('stripeWebhookPlugin', () => {
  it('dispatches to a registered handler and returns 200', async () => {
    const event = createFakeWebhookEvent({
      type: 'customer.subscription.deleted',
    });
    const stripe = createMockStripe();
    vi.mocked(stripe.webhooks.constructEventAsync).mockResolvedValue(event);

    const fastify = await buildApp(stripe);

    const response = await fastify.inject({
      method: 'POST',
      url: '/webhooks/stripe',
      payload: event,
      headers: { 'stripe-signature': 'sig_test' },
    });

    expect(response.statusCode).toBe(200);
    expect(
      vi.mocked(stripe.webhooks.constructEventAsync).mock.calls[0]?.[1],
    ).toBe('sig_test');
  });

  it('returns 200 for unregistered event types', async () => {
    const event = createFakeWebhookEvent({ type: 'charge.succeeded' });
    const stripe = createMockStripe();
    vi.mocked(stripe.webhooks.constructEventAsync).mockResolvedValue(event);

    const fastify = await buildApp(stripe);

    const response = await fastify.inject({
      method: 'POST',
      url: '/webhooks/stripe',
      payload: event,
      headers: { 'stripe-signature': 'sig_test' },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ success: true });
  });

  it('returns 400 when signature verification fails', async () => {
    const stripe = createMockStripe();
    vi.mocked(stripe.webhooks.constructEventAsync).mockRejectedValue(
      new Error('Invalid signature'),
    );

    const fastify = await buildApp(stripe);

    const response = await fastify.inject({
      method: 'POST',
      url: '/webhooks/stripe',
      payload: { id: 'evt_bad' },
      headers: { 'stripe-signature': 'bad_sig' },
    });

    expect(response.statusCode).toBe(400);
  });
});
