import { z } from 'zod';

import { builder } from '@src/plugins/graphql/builder.js';
import { prisma } from '@src/services/prisma.js';
import { throwIfPrismaNotFound } from '@src/utils/http-errors.js';

import { userPolicy } from '../authorizers/user.policy.js';

builder.queryField('user', (t) =>
  t.prismaField({
    type: 'User',
    authorize: ['user'],
    args: { id: t.arg({ required: true, type: 'Uuid' }) },
    resolve: async (query, _root, { id }, ctx) =>
      prisma.user
        .findUniqueOrThrow({
          ...query,
          where: userPolicy.read.whereUnique(ctx, { id }),
        })
        .catch(throwIfPrismaNotFound('User not found')),
  }),
);

builder.queryField('users', (t) =>
  t.prismaField({
    type: ['User'],
    args: {
      skip: t.arg.int({ validate: z.int().min(0) }),
      take: t.arg.int({ validate: z.int().min(0) }),
    },
    authorize: ['user'],
    resolve: async (query, _root, { skip, take }, ctx) =>
      prisma.user.findMany({
        ...query,
        where: userPolicy.read.where(ctx),
        skip: skip ?? undefined,
        take: take ?? undefined,
      }),
  }),
);
