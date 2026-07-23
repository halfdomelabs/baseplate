import { z } from 'zod';

import { builder } from '@src/plugins/graphql/builder.js';
import { prisma } from '@src/services/prisma.js';
import { throwIfPrismaNotFound } from '@src/utils/http-errors.js';

import { blogPostPolicy } from '../authorizers/blog-post.policy.js';

builder.queryField('blogPost', (t) =>
  t.prismaField({
    type: 'BlogPost',
    authorize: ['user'],
    args: { id: t.arg({ required: true, type: 'Uuid' }) },
    resolve: async (query, _root, { id }, ctx) =>
      prisma.blogPost
        .findUniqueOrThrow({
          ...query,
          where: blogPostPolicy.read.whereUnique(ctx, { id }),
        })
        .catch(throwIfPrismaNotFound('BlogPost not found')),
  }),
);

builder.queryField('blogPosts', (t) =>
  t.prismaField({
    type: ['BlogPost'],
    args: {
      skip: t.arg.int({ validate: z.int().min(0) }),
      take: t.arg.int({ validate: z.int().min(0) }),
    },
    authorize: ['user'],
    resolve: async (query, _root, { skip, take }, ctx) =>
      prisma.blogPost.findMany({
        ...query,
        where: blogPostPolicy.read.where(ctx),
        skip: skip ?? undefined,
        take: take ?? undefined,
      }),
  }),
);
