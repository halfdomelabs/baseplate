import { builder } from '@src/plugins/graphql/builder.js';

export const userObjectType = builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name', { nullable: true }),
    email: t.exposeString('email'),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    customer: t.relation('customer', { nullable: true }),
    roles: t.relation('roles'),
    todoLists: t.relation('todoLists'),
    userProfile: t.relation('userProfile', { nullable: true }),
  }),
});
