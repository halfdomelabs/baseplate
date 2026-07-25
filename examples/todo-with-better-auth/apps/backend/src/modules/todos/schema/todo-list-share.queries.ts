import { z } from 'zod';

import { builder } from '@src/plugins/graphql/builder.js';
import { applyStableOrderBy } from '@src/plugins/graphql/sort-order.js';
import { prisma } from '@src/services/prisma.js';

import {
  todoListShareOrderByInputType,
  todoListSharePrimaryKeyInputType,
} from './todo-list-share.object-type.js';

builder.queryField('todoListShare', (t) =>
  t.prismaField({
    type: 'TodoListShare',
    authorize: ['user'],
    args: {
      id: t.arg({ required: true, type: todoListSharePrimaryKeyInputType }),
    },
    resolve: async (query, root, { id }) =>
      prisma.todoListShare.findUniqueOrThrow({
        ...query,
        where: { todoListId_userId: id },
      }),
  }),
);

builder.queryField('todoListShares', (t) =>
  t.prismaField({
    type: ['TodoListShare'],
    args: {
      skip: t.arg.int({ validate: z.int().min(0) }),
      take: t.arg.int({ validate: z.int().min(0) }),
      orderBy: t.arg({ type: [todoListShareOrderByInputType] }),
    },
    authorize: ['user'],
    resolve: async (query, _root, { skip, take, orderBy }) =>
      prisma.todoListShare.findMany({
        ...query,
        orderBy:
          applyStableOrderBy(orderBy, ['todoListId', 'userId']) ?? undefined,
        skip: skip ?? undefined,
        take: take ?? undefined,
      }),
  }),
);

builder.queryField('todoListSharesConnection', (t) =>
  t.prismaConnection(
    {
      type: 'TodoListShare',
      cursor: 'todoListId_userId',
      args: { orderBy: t.arg({ type: [todoListShareOrderByInputType] }) },
      authorize: ['user'],
      totalCount: () => prisma.todoListShare.count(),
      resolve: async (query, _root, { orderBy }) =>
        prisma.todoListShare.findMany({
          ...query,
          orderBy:
            applyStableOrderBy(orderBy, ['todoListId', 'userId']) ?? undefined,
        }),
    },
    { name: 'TodoListShareConnection' },
    { name: 'TodoListShareEdge' },
  ),
);
