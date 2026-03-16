// @ts-nocheck

import type { Stripe } from 'stripe';

import { stripeEventHandlers } from '$serviceEventHandlers';
import { config } from '%configServiceImports';
import { BadRequestError, logError } from '%errorHandlerServiceImports';
import { stripe } from '%fastifyStripeImports';
import { logger } from '%loggerServiceImports';
import fp from 'fastify-plugin';

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
