/* eslint-disable @typescript-eslint/unbound-method */
import type { Stripe } from 'stripe';

import Fastify, { type FastifyInstance } from 'fastify';
import rawBodyPlugin from 'fastify-raw-body';
import { describe, expect, it, vi } from 'vitest';

import type { AppServices } from '@src/utils/runtime-services.js';

import { stripeWebhookPlugin } from '@src/plugins/stripe-webhook.js';

vi.mock('@src/services/config.js', () => ({
  getConfig: () => ({
    STRIPE_SECRET_KEY: 'sk_test_fake',
    STRIPE_ENDPOINT_SECRET: 'whsec_test_fake',
  }),
}));
vi.mock('@src/services/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

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
    data: { object: {} },
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

function createMockBilling(): AppServices['billing'] {
  return {
    getOrCreateAccount: vi.fn(),
    handleSubscriptionEvent: vi.fn(),
  };
}

async function buildApp(
  services: Pick<AppServices, 'billing' | 'stripe'>,
): Promise<FastifyInstance> {
  const fastify = Fastify();
  await fastify.register(rawBodyPlugin, { global: false });
  await fastify.register(stripeWebhookPlugin, { services });
  return fastify;
}

describe('stripeWebhookPlugin', () => {
  it('dispatches to a registered handler and returns 200', async () => {
    const event = createFakeWebhookEvent({
      type: 'customer.subscription.deleted',
    });
    const stripe = createMockStripe();
    const billing = createMockBilling();
    vi.mocked(stripe.webhooks.constructEventAsync).mockResolvedValue(event);

    const fastify = await buildApp({ stripe, billing });

    const response = await fastify.inject({
      method: 'POST',
      url: '/webhooks/stripe',
      payload: event,
      headers: { 'stripe-signature': 'sig_test' },
    });

    expect(response.statusCode).toBe(200);
    expect(billing.handleSubscriptionEvent).toHaveBeenCalledWith(event);
    expect(
      vi.mocked(stripe.webhooks.constructEventAsync).mock.calls[0]?.[1],
    ).toBe('sig_test');
  });

  it('returns 200 for unregistered event types', async () => {
    const event = createFakeWebhookEvent({ type: 'charge.succeeded' });
    const stripe = createMockStripe();
    const billing = createMockBilling();
    vi.mocked(stripe.webhooks.constructEventAsync).mockResolvedValue(event);

    const fastify = await buildApp({ stripe, billing });

    const response = await fastify.inject({
      method: 'POST',
      url: '/webhooks/stripe',
      payload: event,
      headers: { 'stripe-signature': 'sig_test' },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ success: true });
    expect(billing.handleSubscriptionEvent).not.toHaveBeenCalled();
  });

  it('returns 400 when signature verification fails', async () => {
    const stripe = createMockStripe();
    const billing = createMockBilling();
    vi.mocked(stripe.webhooks.constructEventAsync).mockRejectedValue(
      new Error('Invalid signature'),
    );

    const fastify = await buildApp({ stripe, billing });

    const response = await fastify.inject({
      method: 'POST',
      url: '/webhooks/stripe',
      payload: { id: 'evt_bad' },
      headers: { 'stripe-signature': 'bad_sig' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('propagates an error when the handler throws, so Stripe retries', async () => {
    const event = createFakeWebhookEvent({
      type: 'customer.subscription.updated',
    });
    const stripe = createMockStripe();
    const billing = createMockBilling();
    vi.mocked(stripe.webhooks.constructEventAsync).mockResolvedValue(event);
    vi.mocked(billing.handleSubscriptionEvent).mockRejectedValue(
      new Error('No BillingAccount found for Stripe customer: cus_test_123'),
    );

    const fastify = await buildApp({ stripe, billing });

    const response = await fastify.inject({
      method: 'POST',
      url: '/webhooks/stripe',
      payload: event,
      headers: { 'stripe-signature': 'sig_test' },
    });

    expect(response.statusCode).toBe(500);
  });
});
