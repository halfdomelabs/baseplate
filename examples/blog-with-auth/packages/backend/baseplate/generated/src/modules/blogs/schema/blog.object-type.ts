import { builder } from '@src/plugins/graphql/builder.js';

export const blogObjectType = builder.prismaObject('Blog', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    userId: t.expose('userId', { type: 'Uuid' }),
  }),
});
