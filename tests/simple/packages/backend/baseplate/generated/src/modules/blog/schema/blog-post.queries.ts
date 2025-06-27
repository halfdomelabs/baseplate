import { builder } from '@src/plugins/graphql/builder.js';
import { prisma } from '@src/services/prisma.js';

builder.queryField('blogPost', (t) =>
  t.prismaField({
    type: 'BlogPost',
    args: { id: t.arg({ required: true, type: 'Uuid' }) },
    resolve: async (query, root, { id }) =>
      prisma.blogPost.findUniqueOrThrow({ ...query, where: { id } }),
  }),
);

builder.queryField('blogPosts', (t) =>
  t.prismaField({
    type: ['BlogPost'],
    resolve: async (query) => prisma.blogPost.findMany({ ...query }),
  }),
);
