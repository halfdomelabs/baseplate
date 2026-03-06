import { prisma } from '@src/services/prisma.js';
import { createModelAuthorizer } from '@src/utils/authorizers.js';

export const todoListAuthorizer = createModelAuthorizer({
  model: 'todoList',
  idField: 'id',
  getModelById: (id) => prisma.todoList.findUnique({ where: { id } }),
  roles: { owner: (ctx, model) => model.ownerId === ctx.auth.userId },
});
