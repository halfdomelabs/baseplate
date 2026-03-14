import { builder } from '@src/plugins/graphql/builder.js';

export const billingSubscriptionStatusEnum = builder.enumType(
  'BillingSubscriptionStatus',
  {
    values: {
      ACTIVE: {},
      TRIALING: {},
      PAST_DUE: {},
      CANCELED: {},
      UNPAID: {},
      INCOMPLETE: {},
      INCOMPLETE_EXPIRED: {},
    },
  },
);
