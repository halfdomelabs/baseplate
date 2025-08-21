import { builder } from '@src/plugins/graphql/builder.js';

export const userObjectType = builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeID('id'),
    email: t.exposeString('email', { nullable: true }),
    name: t.exposeString('name', { nullable: true }),
    emailVerified: t.exposeBoolean('emailVerified'),
    roles: t.relation('roles'),
  }),
});
