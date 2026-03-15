import type { Stripe } from 'stripe';

import Fastify, { type FastifyInstance } from 'fastify';
import rawBodyPlugin from 'fastify-raw-body';
import { describe, expect, it, vi } from 'vitest';

import { stripeWebhookPlugin } from '@src/plugins/stripe-webhook.js';
import { stripeEventHandlers } from '@src/services/stripe-event-handlers.js';
import { stripe } from '@src/services/stripe.js';

vi.mock('@src/services/config.js', () => ({
  config: {
    STRIPE_SECRET_KEY: 'sk_test_fake',
    STRIPE_ENDPOINT_SECRET: 'whsec_test_fake',
  },
}));
vi.mock('@src/services/stripe.js');
vi.mock('@src/services/stripe-event-handlers.js', () => ({
  stripeEventHandlers: {} as Record<string, unknown>,
}));

const mockedStripe = vi.mocked(stripe, true);

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
      object: { id: 'sub_test_123' } as Stripe.Subscription,
    },
    ...overrides,
  } as Stripe.Event;
}

async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify();
  await fastify.register(rawBodyPlugin, { global: false });
  await fastify.register(stripeWebhookPlugin);
  return fastify;
}

describe('stripeWebhookPlugin', () => {
  it('dispatches to a registered handler and returns 200', async () => {
    const event = createFakeWebhookEvent();
    mockedStripe.webhooks.constructEventAsync.mockResolvedValue(event);

    const handler = vi.fn().mockResolvedValue(undefined);
    (stripeEventHandlers as Record<string, unknown>)[
      'customer.subscription.created'
    ] = handler;

    const fastify = await buildApp();

    const response = await fastify.inject({
      method: 'POST',
      url: '/webhooks/stripe',
      payload: event,
      headers: { 'stripe-signature': 'sig_test' },
    });

    expect(response.statusCode).toBe(200);
    expect(handler).toHaveBeenCalledWith(event);
    expect(mockedStripe.webhooks.constructEventAsync.mock.calls[0]?.[1]).toBe(
      'sig_test',
    );

    // Clean up
    delete (stripeEventHandlers as Record<string, unknown>)[
      'customer.subscription.created'
    ];
  });

  it('returns 200 for unregistered event types', async () => {
    const event = createFakeWebhookEvent({ type: 'charge.succeeded' });
    mockedStripe.webhooks.constructEventAsync.mockResolvedValue(event);

    const fastify = await buildApp();

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
    mockedStripe.webhooks.constructEventAsync.mockRejectedValue(
      new Error('Invalid signature'),
    );

    const fastify = await buildApp();

    const response = await fastify.inject({
      method: 'POST',
      url: '/webhooks/stripe',
      payload: { id: 'evt_bad' },
      headers: { 'stripe-signature': 'bad_sig' },
    });

    expect(response.statusCode).toBe(400);
  });
});
