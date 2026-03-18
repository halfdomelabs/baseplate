import { builder } from '@src/plugins/graphql/builder.js';

import { userAuthorizer } from '../authorizers/user.authorizer.js';

export const userObjectType = builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeID('id'),
    email: t.exposeString('email', {
      authorize: ['admin', userAuthorizer.roles.owner],
      nullable: true,
    }),
    name: t.exposeString('name', { nullable: true }),
    emailVerified: t.exposeBoolean('emailVerified'),
    roles: t.relation('roles'),
  }),
});
