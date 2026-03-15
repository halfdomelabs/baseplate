import type { Stripe } from 'stripe';

import fp from 'fastify-plugin';

import { config } from '../services/config.js';
import { logError } from '../services/error-logger.js';
import { logger } from '../services/logger.js';
import { stripeEventHandlers } from '../services/stripe-event-handlers.js';
import { stripe } from '../services/stripe.js';
import { BadRequestError } from '../utils/http-errors.js';

/**
 * Constructs and verifies a Stripe event from the raw webhook body.
 *
 * @param rawBody - The raw request body.
 * @param signature - The Stripe signature header.
 * @returns The verified Stripe event.
 */
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

/** Fastify plugin that handles incoming Stripe webhook events. */
export const stripeWebhookPlugin = fp(
  (fastify, opts, done) => {
    fastify.post('/webhooks/stripe', {
      config: { rawBody: true },
      handler: async (req, reply) => {
        const signature = req.headers['stripe-signature'] ?? '';

        const event = await getStripeEvent(req.rawBody, signature);

        const handler = stripeEventHandlers[event.type];

        if (handler) {
          await handler(event);
        } else {
          logger.info(`No handler registered for event type ${event.type}`);
        }

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
