import type { FastifyPluginCallback } from 'fastify';
import type { Stripe } from 'stripe';

import fp from 'fastify-plugin';

import type { AppServices } from '../utils/runtime-services.js';

import { getConfig } from '../services/config.js';
import { logError } from '../services/error-logger.js';
import { logger } from '../services/logger.js';
import { createStripeEventHandlers } from '../services/stripe-event-handlers.js';
import { BadRequestError } from '../utils/http-errors.js';

/**
 * Constructs and verifies a Stripe event from the raw webhook body.
 *
 * @param stripe - The Stripe client.
 * @param rawBody - The raw request body.
 * @param signature - The Stripe signature header.
 * @returns The verified Stripe event.
 */
async function getStripeEvent(
  stripe: Stripe,
  rawBody: string | Buffer = '',
  signature: string | string[] = '',
): Promise<Stripe.Event> {
  try {
    return await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      getConfig().STRIPE_ENDPOINT_SECRET,
    );
  } catch (err) {
    logError(err);
    throw new BadRequestError('Stripe webhook signature verification failed');
  }
}

const stripeWebhookPluginCallback: FastifyPluginCallback<{
  services: Pick<
    AppServices,
    /* TPL_SERVICES_TYPE:START */ | 'billing'
    | 'stripe' /* TPL_SERVICES_TYPE:END */
  >;
}> = (fastify, { services }, done) => {
  const { stripe } = services;
  const stripeEventHandlers = createStripeEventHandlers(services);

  fastify.post('/webhooks/stripe', {
    config: { rawBody: true },
    handler: async (req, reply) => {
      const signature = req.headers['stripe-signature'] ?? '';

      const event = await getStripeEvent(stripe, req.rawBody, signature);

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
};

/** Fastify plugin that handles incoming Stripe webhook events. */
export const stripeWebhookPlugin = fp(stripeWebhookPluginCallback, {
  encapsulate: true,
  name: 'stripe-webhook',
});
