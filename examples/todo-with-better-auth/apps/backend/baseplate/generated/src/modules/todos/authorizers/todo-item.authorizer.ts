import { prisma } from '@src/services/prisma.js';
import { createModelAuthorizer } from '@src/utils/authorizers.js';

import { todoListAuthorizer } from './todo-list.authorizer.js';

export const todoItemAuthorizer = createModelAuthorizer({
  model: 'todoItem',
  idField: 'id',
  getModelById: (id) => prisma.todoItem.findUnique({ where: { id } }),
  roles: {
    owner: async (ctx, model) =>
      (await todoListAuthorizer.hasRoleById(ctx, model.todoListId, 'owner')) ||
      ctx.auth.hasRole('admin'),
  },
});
