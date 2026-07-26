// @ts-nocheck

import type { AppServices } from '%appRuntimeImports';
import type Stripe from 'stripe';

/** Handler function for a Stripe webhook event. */
export type StripeEventHandler = (event: Stripe.Event) => Promise<void>;

/**
 * Builds the map of Stripe event types to their handler functions.
 *
 * Each event type has a single handler. To handle multiple concerns for one
 * event, compose the logic within the handler function.
 *
 * @param services - The services closed over by handlers that need them.
 * @returns The event type to handler map.
 */
export function createStripeEventHandlers(
  services: Pick<AppServices, TPL_SERVICES_TYPE>,
): Partial<Record<string, StripeEventHandler>> {
  TPL_SERVICES_DESTRUCTURE;

  return TPL_EVENT_HANDLERS;
}
