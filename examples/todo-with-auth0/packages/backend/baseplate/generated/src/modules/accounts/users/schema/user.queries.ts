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
    authorize: ['user'],
    resolve: async (query) => prisma.user.findMany({ ...query }),
  }),
);
