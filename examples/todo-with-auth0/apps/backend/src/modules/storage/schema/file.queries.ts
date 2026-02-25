import { builder } from '@src/plugins/graphql/builder.js';
import { prisma } from '@src/services/prisma.js';

builder.queryField('file', (t) =>
  t.prismaField({
    type: 'File',
    authorize: ['user', 'admin'],
    args: { id: t.arg({ required: true, type: 'Uuid' }) },
    resolve: async (query, root, { id }) =>
      prisma.file.findUniqueOrThrow({ ...query, where: { id } }),
  }),
);

builder.queryField('files', (t) =>
  t.prismaField({
    type: ['File'],
    args: {
      skip: t.arg.int(),
      take: t.arg.int(),
    },
    authorize: ['user', 'admin'],
    resolve: async (query, root, { skip, take }) =>
      prisma.file.findMany({
        ...query,
        skip: skip ?? undefined,
        take: take ?? undefined,
      }),
  }),
);
