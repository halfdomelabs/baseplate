import { builder } from '@src/plugins/graphql/builder.js';
import { prisma } from '@src/services/prisma.js';

builder.queryField('todoItem', (t) =>
  t.prismaField({
    type: 'TodoItem',
    authorize: ['user'],
    args: { id: t.arg({ required: true, type: 'Uuid' }) },
    resolve: async (query, root, { id }) =>
      prisma.todoItem.findUniqueOrThrow({ ...query, where: { id } }),
  }),
);

builder.queryField('todoItems', (t) =>
  t.prismaField({
    type: ['TodoItem'],
    args: {
      skip: t.arg.int(),
      take: t.arg.int(),
    },
    authorize: ['user'],
    resolve: async (query, root, { skip, take }) =>
      prisma.todoItem.findMany({
        ...query,
        skip: skip ?? undefined,
        take: take ?? undefined,
      }),
  }),
);
