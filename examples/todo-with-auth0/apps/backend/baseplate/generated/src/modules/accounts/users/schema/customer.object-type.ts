import { builder } from '@src/plugins/graphql/builder.js';

export const customerObjectType = builder.prismaObject('Customer', {
  fields: (t) => ({
    id: t.exposeID('id'),
    stripeCustomerId: t.exposeString('stripeCustomerId'),
    user: t.relation('user'),
  }),
});
