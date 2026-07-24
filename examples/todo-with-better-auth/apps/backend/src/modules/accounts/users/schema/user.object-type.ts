import { builder } from '@src/plugins/graphql/builder.js';

import { userPolicy } from '../authorizers/user.policy.js';

export const userObjectType = builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    email: t.exposeString('email', {
      authorize: ['admin', userPolicy.roles.self.check],
    }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    customer: t.relation('customer', { nullable: true }),
    roles: t.relation('roles'),
    todoLists: t.relation('todoLists'),
    userProfile: t.relation('userProfile', { nullable: true }),
  }),
});
