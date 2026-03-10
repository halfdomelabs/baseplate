import { z } from 'zod';

import { builder } from '@src/plugins/graphql/builder.js';
import { prisma } from '@src/services/prisma.js';

import { todoListQueryFilter } from '../authorizers/todo-list.query-filter.js';

builder.queryField('todoList', (t) =>
  t.prismaField({
    type: 'TodoList',
    authorize: ['admin'],
    args: { id: t.arg({ required: true, type: 'Uuid' }) },
    resolve: async (query, _root, { id }, ctx) =>
      prisma.todoList.findUniqueOrThrow({
        ...query,
        where: {
          id,
          ...todoListQueryFilter.buildWhere(ctx, ['owner'], {
            bypassRoles: ['admin'],
          }),
        },
      }),
  }),
);

builder.queryField('todoLists', (t) =>
  t.prismaField({
    type: ['TodoList'],
    args: {
      skip: t.arg.int({ validate: z.int().min(0) }),
      take: t.arg.int({ validate: z.int().min(0) }),
    },
    authorize: ['admin'],
    resolve: async (query, _root, { skip, take }, ctx) =>
      prisma.todoList.findMany({
        ...query,
        where: {
          ...todoListQueryFilter.buildWhere(ctx, ['owner'], {
            bypassRoles: ['admin'],
          }),
        },
        skip: skip ?? undefined,
        take: take ?? undefined,
      }),
  }),
);
