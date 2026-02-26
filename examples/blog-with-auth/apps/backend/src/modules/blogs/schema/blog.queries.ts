import { z } from 'zod';

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
    args: {
      skip: t.arg.int({ validate: z.int().min(0) }),
      take: t.arg.int({ validate: z.int().min(0) }),
    },
    authorize: ['public'],
    resolve: async (query, _root, { skip, take }) =>
      prisma.blog.findMany({
        ...query,
        skip: skip ?? undefined,
        take: take ?? undefined,
      }),
  }),
);
