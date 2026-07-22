import { builder } from '@src/plugins/graphql/builder.js';

import { userPolicy } from '../authorizers/user.policy.js';

export const userObjectType = builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeID('id'),
    email: t.exposeString('email', {
      authorize: ['admin', userPolicy.roles.self.check],
      nullable: true,
    }),
    name: t.exposeString('name', { nullable: true }),
    emailVerified: t.exposeBoolean('emailVerified'),
    roles: t.relation('roles'),
  }),
});
