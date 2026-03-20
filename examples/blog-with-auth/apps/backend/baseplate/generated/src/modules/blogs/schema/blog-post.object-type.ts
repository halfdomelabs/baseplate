import { builder } from '@src/plugins/graphql/builder.js';

export const blogPostObjectType = builder.prismaObject('BlogPost', {
  fields: (t) => ({
    blogId: t.expose('blogId', { type: 'Uuid' }),
    publisherId: t.expose('publisherId', { type: 'Uuid' }),
    title: t.exposeString('title'),
    content: t.exposeString('content'),
    metadata: t.expose('metadata', { nullable: true, type: 'JSON' }),
  }),
});
