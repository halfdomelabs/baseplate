import { z } from 'zod';

import { builder } from '@src/plugins/graphql/builder.js';
import { prisma } from '@src/services/prisma.js';

builder.queryField('todoList', (t) =>
  t.prismaField({
    type: 'TodoList',
    authorize: ['user'],
    args: { id: t.arg({ required: true, type: 'Uuid' }) },
    resolve: async (query, root, { id }) =>
      prisma.todoList.findUniqueOrThrow({ ...query, where: { id } }),
  }),
);

builder.queryField('todoLists', (t) =>
  t.prismaField({
    type: ['TodoList'],
    args: {
      skip: t.arg.int({ validate: z.int().min(0) }),
      take: t.arg.int({ validate: z.int().min(0) }),
    },
    authorize: ['user'],
    resolve: async (query, _root, { skip, take }) =>
      prisma.todoList.findMany({
        ...query,
        skip: skip ?? undefined,
        take: take ?? undefined,
      }),
  }),
);
