// @ts-nocheck

import Fastify from 'fastify';
import rawBodyPlugin from 'fastify-raw-body';
import { Stripe } from 'stripe';
import { stripe } from '@/src/services/stripe';
import { stripeEventService } from '@/src/services/stripe-events';
import { stripeWebhookPlugin } from './stripe-webhook';

jest.mock('@src/services/stripe');

const mockedStripe = jest.mocked(stripe, true);

function createFakeWebhookEvent(data?: Partial<Stripe.Event>): Stripe.Event {
  return {
    id: 'payment-id',
    object: 'event',
    api_version: '2020-08-27',
    created: 1642600000,
    livemode: false,
    pending_webhooks: 0,
    type: 'payment_intent.succeeded',
    request: null,
    data: {
      object: {
        amount: 100,
      },
    },
    ...data,
  };
}

describe('stripeWebhookPlugin', () => {
  it('handles webhook and calls stripe event service', async () => {
    mockedStripe.webhooks.constructEventAsync.mockResolvedValue(
      createFakeWebhookEvent()
    );

    const fastify = Fastify();
    await fastify.register(rawBodyPlugin, { global: false });
    await fastify.register(stripeWebhookPlugin);

    const eventHandler = jest.fn();
    stripeEventService.registerHandler(
      'payment_intent.succeeded',
      eventHandler
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

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockedStripe.webhooks.constructEventAsync.mock.calls[0][1]).toBe(
      'signature'
    );

    expect(eventHandler).toHaveBeenCalledWith(event);
  });
});
