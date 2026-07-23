import { z } from 'zod';

import { builder } from '@src/plugins/graphql/builder.js';
import { prisma } from '@src/services/prisma.js';
import { throwIfPrismaNotFound } from '@src/utils/http-errors.js';

import { blogPolicy } from '../authorizers/blog.policy.js';

builder.queryField('blog', (t) =>
  t.prismaField({
    type: 'Blog',
    authorize: ['public'],
    args: { id: t.arg({ required: true, type: 'Uuid' }) },
    resolve: async (query, _root, { id }, ctx) =>
      prisma.blog
        .findUniqueOrThrow({
          ...query,
          where: blogPolicy.read.whereUnique(ctx, { id }),
        })
        .catch(throwIfPrismaNotFound('Blog not found')),
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
    resolve: async (query, _root, { skip, take }, ctx) =>
      prisma.blog.findMany({
        ...query,
        where: blogPolicy.read.where(ctx),
        skip: skip ?? undefined,
        take: take ?? undefined,
      }),
  }),
);
