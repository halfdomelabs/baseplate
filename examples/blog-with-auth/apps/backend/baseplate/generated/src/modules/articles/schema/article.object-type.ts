import { builder } from '@src/plugins/graphql/builder.js';

export const articleObjectType = builder.prismaObject('Article', {
  fields: (t) => ({
    title: t.exposeString('title'),
    content: t.exposeString('content'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});
