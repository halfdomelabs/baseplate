import { builder } from '@src/plugins/graphql/builder.js';

export const billingSubscriptionStatusEnum = builder.enumType(
  'BillingSubscriptionStatus',
  {
    values: {
      ACTIVE: { description: 'Subscription is active and billing normally' },
      TRIALING: { description: 'Subscription is in a free trial period' },
      PAST_DUE: {
        description:
          'Payment failed but the subscription has not been canceled yet',
      },
      CANCELED: { description: 'Subscription has been canceled' },
      UNPAID: {
        description:
          'Payment retries have been exhausted and the subscription remains unpaid',
      },
      INCOMPLETE: {
        description:
          'Initial payment attempt failed when creating the subscription',
      },
      INCOMPLETE_EXPIRED: {
        description:
          'First invoice was not paid within the allowed time period',
      },
      PAUSED: { description: 'Subscription has been temporarily paused' },
    },
  },
);
