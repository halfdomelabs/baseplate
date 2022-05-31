// @ts-nocheck

import Stripe from 'stripe';
import { logger } from '%logger-service';

export type StripeEventHandler = (event: Stripe.Event) => Promise<void>;

const eventHandlers: Record<string, StripeEventHandler> = {};

/**
 * Service that allows registering handlers from Stripe events.
 */
export const stripeEventService = {
  registerHandler(type: string, handler: StripeEventHandler): void {
    if (eventHandlers[type]) {
      throw new Error(`Handler for ${type} already registered`);
    }
    eventHandlers[type] = handler;
  },
  async handleStripeEvent(event: Stripe.Event): Promise<void> {
    const handler = eventHandlers[event.type];

    if (!handler) {
      logger.info(`No handler registered for event type ${event.type}`);
      return;
    }
    await handler(event);
  },
};
