import { builder } from '@src/plugins/graphql/builder.js';

export const blogPostObjectType = builder.prismaObject('BlogPost', {
  fields: (t) => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    content: t.exposeString('content'),
  }),
});
