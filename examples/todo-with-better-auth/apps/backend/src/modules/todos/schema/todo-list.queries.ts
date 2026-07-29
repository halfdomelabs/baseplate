import { z } from 'zod';

import { builder } from '@src/plugins/graphql/builder.js';
import { validateWhereComplexity } from '@src/plugins/graphql/filters.js';
import { applyStableOrderBy } from '@src/plugins/graphql/sort-order.js';
import { prisma } from '@src/services/prisma.js';
import { throwIfPrismaNotFound } from '@src/utils/http-errors.js';

import { todoListPolicy } from '../authorizers/todo-list.policy.js';
import {
  todoListOrderByInputType,
  todoListWhereInputType,
} from './todo-list.object-type.js';

builder.queryField('todoList', (t) =>
  t.prismaField({
    type: 'TodoList',
    authorize: ['admin'],
    args: { id: t.arg({ required: true, type: 'Uuid' }) },
    resolve: async (query, _root, { id }, ctx) =>
      prisma.todoList
        .findUniqueOrThrow({
          ...query,
          where: todoListPolicy.actions.read.whereUnique(ctx, { id }),
        })
        .catch(throwIfPrismaNotFound('TodoList not found')),
  }),
);

builder.queryField('todoLists', (t) =>
  t.prismaField({
    type: ['TodoList'],
    args: {
      skip: t.arg.int({ validate: z.int().min(0) }),
      take: t.arg.int({ validate: z.int().min(0).max(100) }),
      where: t.arg({
        type: todoListWhereInputType,
        validate: z.custom((where) => validateWhereComplexity(where, 4, 25), {
          message: 'where filter is too deeply nested or has too many clauses',
        }),
      }),
      orderBy: t.arg({ type: [todoListOrderByInputType] }),
    },
    authorize: ['admin'],
    resolve: async (query, _root, { skip, take, where, orderBy }, ctx) =>
      prisma.todoList.findMany({
        ...query,
        where: todoListPolicy.actions.read.where(ctx, where ?? undefined),
        orderBy:
          applyStableOrderBy(orderBy, ['id'], [{ position: 'asc' }]) ??
          undefined,
        skip: skip ?? undefined,
        take: take ?? 25,
      }),
  }),
);

builder.queryField('todoListsConnection', (t) =>
  t.prismaConnection(
    {
      type: 'TodoList',
      cursor: 'id',
      defaultSize: 25,
      maxSize: 100,
      args: {
        where: t.arg({
          type: todoListWhereInputType,
          validate: z.custom((where) => validateWhereComplexity(where, 4, 25), {
            message:
              'where filter is too deeply nested or has too many clauses',
          }),
        }),
        orderBy: t.arg({ type: [todoListOrderByInputType] }),
      },
      authorize: ['admin'],
      totalCount: (_connection, { where }, ctx) =>
        prisma.todoList.count({
          where: todoListPolicy.actions.read.where(ctx, where ?? undefined),
        }),
      resolve: async (query, _root, { where, orderBy }, ctx) =>
        prisma.todoList.findMany({
          ...query,
          where: todoListPolicy.actions.read.where(ctx, where ?? undefined),
          orderBy:
            applyStableOrderBy(orderBy, ['id'], [{ position: 'asc' }]) ??
            undefined,
        }),
    },
    { name: 'TodoListConnection' },
    { name: 'TodoListEdge' },
  ),
);
