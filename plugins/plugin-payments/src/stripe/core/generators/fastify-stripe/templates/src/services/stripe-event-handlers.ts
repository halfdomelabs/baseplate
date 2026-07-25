// @ts-nocheck

import type Stripe from 'stripe';

/** Handler function for a Stripe webhook event. */
export type StripeEventHandler = (event: Stripe.Event) => Promise<void>;

/**
 * Builds the map of Stripe event types to their handler functions.
 *
 * Each event type has a single handler. To handle multiple concerns for one
 * event, compose the logic within the handler function.
 *
 * @param stripe - The Stripe client, closed over by handlers that call back into the Stripe API.
 * @returns The event type to handler map.
 */
export function createStripeEventHandlers(
  stripe: Stripe,
): Partial<Record<string, StripeEventHandler>> {
  return TPL_EVENT_HANDLERS;
}
