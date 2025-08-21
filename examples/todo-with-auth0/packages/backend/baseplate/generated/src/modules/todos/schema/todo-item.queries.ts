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
    authorize: ['user'],
    resolve: async (query) => prisma.todoItem.findMany({ ...query }),
  }),
);
