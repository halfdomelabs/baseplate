import type Stripe from 'stripe';

import { handleSubscriptionEvent } from '../modules/billing/services/billing.service.js';

/** Handler function for a Stripe webhook event. */
export type StripeEventHandler = (event: Stripe.Event) => Promise<void>;

/**
 * Map of Stripe event types to their handler functions.
 *
 * Each event type has a single handler. To handle multiple concerns for one
 * event, compose the logic within the handler function.
 */
export const stripeEventHandlers: Partial<Record<string, StripeEventHandler>> =
  /* TPL_EVENT_HANDLERS:START */
  {
    'customer.subscription.created': handleSubscriptionEvent,
    'customer.subscription.deleted': handleSubscriptionEvent,
    'customer.subscription.updated': handleSubscriptionEvent,
  };
/* TPL_EVENT_HANDLERS:END */
