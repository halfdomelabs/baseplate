import { z } from 'zod';

import { builder } from '@src/plugins/graphql/builder.js';
import { prisma } from '@src/services/prisma.js';
import { throwIfPrismaNotFound } from '@src/utils/http-errors.js';

import { todoItemPolicy } from '../authorizers/todo-item.policy.js';

builder.queryField('todoItem', (t) =>
  t.prismaField({
    type: 'TodoItem',
    authorize: ['user'],
    args: { id: t.arg({ required: true, type: 'Uuid' }) },
    resolve: async (query, _root, { id }, ctx) =>
      prisma.todoItem
        .findUniqueOrThrow({
          ...query,
          where: todoItemPolicy.read.whereUnique(ctx, { id }),
        })
        .catch(throwIfPrismaNotFound('TodoItem not found')),
  }),
);

builder.queryField('todoItems', (t) =>
  t.prismaField({
    type: ['TodoItem'],
    args: {
      skip: t.arg.int({ validate: z.int().min(0) }),
      take: t.arg.int({ validate: z.int().min(0) }),
    },
    authorize: ['user'],
    resolve: async (query, _root, { skip, take }, ctx) =>
      prisma.todoItem.findMany({
        ...query,
        where: todoItemPolicy.read.where(ctx),
        skip: skip ?? undefined,
        take: take ?? undefined,
      }),
  }),
);
