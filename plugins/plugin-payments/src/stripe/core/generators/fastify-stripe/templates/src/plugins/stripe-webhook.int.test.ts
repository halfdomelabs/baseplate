// @ts-nocheck

import type { Stripe } from 'stripe';

import { stripeWebhookPlugin } from '$pluginsWebhook';
import { stripe } from '$service';
import { stripeEventService } from '$serviceEvents';
import Fastify from 'fastify';
import rawBodyPlugin from 'fastify-raw-body';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@src/services/stripe');

const mockedStripe = vi.mocked(stripe, true);

function createFakeWebhookEvent(data?: Partial<Stripe.Event>): Stripe.Event {
  return {
    id: 'payment-id',
    object: 'event',
    api_version: '2020-08-27',
    created: 1_642_600_000,
    livemode: false,
    pending_webhooks: 0,
    type: 'payment_intent.succeeded',
    request: null,
    data: {
      object: {
        amount: 100,
      } as Stripe.PaymentIntent,
    },
    ...data,
  } as Stripe.Event;
}

describe('stripeWebhookPlugin', () => {
  it('handles webhook and calls stripe event service', async () => {
    mockedStripe.webhooks.constructEventAsync.mockResolvedValue(
      createFakeWebhookEvent(),
    );

    const fastify = Fastify();
    await fastify.register(rawBodyPlugin, { global: false });
    await fastify.register(stripeWebhookPlugin);

    const eventHandler = vi.fn();
    stripeEventService.registerHandler(
      'payment_intent.succeeded',
      eventHandler,
    );

    const event = createFakeWebhookEvent();
    const response = await fastify.inject({
      method: 'POST',
      url: '/webhooks/stripe',
      payload: event,
      headers: {
        'stripe-signature': 'signature',
      },
    });

    expect(response.statusCode).toBe(200);

    expect(mockedStripe.webhooks.constructEventAsync.mock.calls[0][1]).toBe(
      'signature',
    );

    expect(eventHandler).toHaveBeenCalledWith(event);
  });
});
