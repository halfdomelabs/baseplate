import { builder } from '@src/plugins/graphql/builder.js';

export const billingSubscriptionStatusEnum = builder.enumType(
  'BillingSubscriptionStatus',
  {
    description: 'The status of a billing subscription.',
    values: {
      ACTIVE: { description: 'The subscription is active and in good standing.' },
      TRIALING: { description: 'The subscription is in a trial period.' },
      PAST_DUE: {
        description: 'Payment failed but the subscription has not been canceled yet.',
      },
      CANCELED: { description: 'The subscription has been canceled.' },
      UNPAID: {
        description: 'Payment failed and all retry attempts have been exhausted.',
      },
      INCOMPLETE: {
        description: 'The initial payment attempt failed during subscription creation.',
      },
      INCOMPLETE_EXPIRED: {
        description: 'The initial payment was not completed within the allowed window.',
      },
    },
  },
);
