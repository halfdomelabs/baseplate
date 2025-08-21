import type { Stripe } from 'stripe';

import fp from 'fastify-plugin';

import { config } from '../services/config.js';
import { logError } from '../services/error-logger.js';
import { stripeEventService } from '../services/stripe-events.js';
import { stripe } from '../services/stripe.js';
import { BadRequestError } from '../utils/http-errors.js';

async function getStripeEvent(
  rawBody: string | Buffer = '',
  signature: string | string[] = '',
): Promise<Stripe.Event> {
  try {
    return await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      config.STRIPE_ENDPOINT_SECRET,
    );
  } catch (err) {
    logError(err);
    throw new BadRequestError('Stripe webhook signature verification failed');
  }
}

export const stripeWebhookPlugin = fp(
  (fastify, opts, done) => {
    fastify.post('/webhooks/stripe', {
      config: { rawBody: true },
      handler: async (req, reply) => {
        const signature = req.headers['stripe-signature'] ?? '';

        const event = await getStripeEvent(req.rawBody, signature);

        await stripeEventService.handleStripeEvent(event);

        await reply.send({ success: true });
      },
    });

    done();
  },
  {
    encapsulate: true,
    name: 'stripe-webhook',
  },
);
