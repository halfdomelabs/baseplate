import { z } from 'zod';

import { builder } from '@src/plugins/graphql/builder.js';
import { prisma } from '@src/services/prisma.js';
import { throwIfPrismaNotFound } from '@src/utils/http-errors.js';

import { todoListPolicy } from '../authorizers/todo-list.policy.js';

builder.queryField('todoList', (t) =>
  t.prismaField({
    type: 'TodoList',
    authorize: ['admin'],
    args: { id: t.arg({ required: true, type: 'Uuid' }) },
    resolve: async (query, _root, { id }, ctx) =>
      prisma.todoList
        .findUniqueOrThrow({
          ...query,
          where: todoListPolicy.read.whereUnique(ctx, { id }),
        })
        .catch(throwIfPrismaNotFound('TodoList not found')),
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
        where: todoListPolicy.read.where(ctx),
        skip: skip ?? undefined,
        take: take ?? undefined,
      }),
  }),
);
