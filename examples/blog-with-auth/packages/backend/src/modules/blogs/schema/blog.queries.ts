import { builder } from '@src/plugins/graphql/builder.js';
import { prisma } from '@src/services/prisma.js';

builder.queryField('blog', (t) =>
  t.prismaField({
    type: 'Blog',
    authorize: ['public'],
    args: { id: t.arg({ required: true, type: 'Uuid' }) },
    resolve: async (query, root, { id }) =>
      prisma.blog.findUniqueOrThrow({ ...query, where: { id } }),
  }),
);

builder.queryField('blogs', (t) =>
  t.prismaField({
    type: ['Blog'],
    authorize: ['public'],
    resolve: async (query) => prisma.blog.findMany({ ...query }),
  }),
);
