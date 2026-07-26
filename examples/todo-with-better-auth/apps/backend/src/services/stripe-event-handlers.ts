import type Stripe from 'stripe';

import type { AppServices } from '../utils/runtime-services.js';

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
  services: Pick<
    AppServices,
    /* TPL_SERVICES_TYPE:START */ | 'billing'
    | 'stripe' /* TPL_SERVICES_TYPE:END */
  >,
): Partial<Record<string, StripeEventHandler>> {
  /* TPL_SERVICES_DESTRUCTURE:START */
  const { billing } = services;
  /* TPL_SERVICES_DESTRUCTURE:END */

  return /* TPL_EVENT_HANDLERS:START */ {
    'customer.subscription.created': (event) =>
      billing.handleSubscriptionEvent(event),
    'customer.subscription.deleted': (event) =>
      billing.handleSubscriptionEvent(event),
    'customer.subscription.updated': (event) =>
      billing.handleSubscriptionEvent(event),
  } /* TPL_EVENT_HANDLERS:END */;
}
