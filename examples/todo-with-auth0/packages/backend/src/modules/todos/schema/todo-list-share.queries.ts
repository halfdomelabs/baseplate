import { builder } from '@src/plugins/graphql/builder.js';
import { prisma } from '@src/services/prisma.js';

import { todoListSharePrimaryKeyInputType } from './todo-list-share.object-type.js';

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
    authorize: ['user'],
    resolve: async (query) => prisma.todoListShare.findMany({ ...query }),
  }),
);
