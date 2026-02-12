import { prisma } from '@src/services/prisma.js';
import { createModelAuthorizer } from '@src/utils/authorizers.js';

export const userAuthorizer = createModelAuthorizer({
  model: 'user',
  idField: 'id',
  getModelById: (id) => prisma.user.findUnique({ where: { id } }),
  roles: { owner: (ctx, model) => model.id === ctx.auth.userId },
});
