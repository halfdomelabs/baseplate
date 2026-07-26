// @ts-nocheck

import type { AppServices } from '%appRuntimeImports';
import type { FastifyPluginCallback } from 'fastify';
import type { Stripe } from 'stripe';

import { createStripeEventHandlers } from '$serviceEventHandlers';
import { config } from '%configServiceImports';
import { BadRequestError, logError } from '%errorHandlerServiceImports';
import { logger } from '%loggerServiceImports';
import fp from 'fastify-plugin';

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
      config.STRIPE_ENDPOINT_SECRET,
    );
  } catch (err) {
    logError(err);
    throw new BadRequestError('Stripe webhook signature verification failed');
  }
}

const stripeWebhookPluginCallback: FastifyPluginCallback<{
  services: Pick<AppServices, TPL_SERVICES_TYPE>;
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
