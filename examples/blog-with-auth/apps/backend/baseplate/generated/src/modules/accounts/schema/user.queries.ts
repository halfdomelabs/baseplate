import { builder } from '@src/plugins/graphql/builder.js';
import { prisma } from '@src/services/prisma.js';

builder.queryField('user', (t) =>
  t.prismaField({
    type: 'User',
    authorize: ['user'],
    args: { id: t.arg({ required: true, type: 'Uuid' }) },
    resolve: async (query, root, { id }) =>
      prisma.user.findUniqueOrThrow({ ...query, where: { id } }),
  }),
);

builder.queryField('users', (t) =>
  t.prismaField({
    type: ['User'],
    args: {
      skip: t.arg.int(),
      take: t.arg.int(),
    },
    authorize: ['admin'],
    resolve: async (query, root, { skip, take }) =>
      prisma.user.findMany({
        ...query,
        skip: skip ?? undefined,
        take: take ?? undefined,
      }),
  }),
);
