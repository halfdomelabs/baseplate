// @ts-nocheck

import { FastifyPluginAsync } from 'fastify';
import { Stripe } from 'stripe';
import { config } from '%config';
import { logError } from '%error-logger';
import { stripe } from '@/src/services/stripe';
import { stripeEventService } from '@/src/services/stripe-events';
import { BadRequestError } from '%http-errors';

async function getStripeEvent(
  rawBody: string | Buffer = '',
  signature: string | string[] = ''
): Promise<Stripe.Event> {
  try {
    return await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      config.STRIPE_ENDPOINT_SECRET
    );
  } catch (err) {
    logError(err);
    throw new BadRequestError('Stripe webhook signature verification failed');
  }
}

export const stripeWebhookPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.post('/webhooks/stripe', {
    config: { rawBody: true },
    handler: async (req, reply) => {
      const signature = req.headers['stripe-signature'] || '';

      const event = await getStripeEvent(req.rawBody, signature);

      await stripeEventService.handleStripeEvent(event);

      await reply.send({ success: true });
    },
  });
};
