import { prisma } from '@src/services/prisma.js';
import { createModelPolicy } from '@src/utils/authorizers.js';

export const userPolicy = createModelPolicy({
  model: 'user',
  idField: 'id',
  delegate: prisma.user,
  roles: (r) => ({
    self: r.match((ctx) =>
      ctx.auth.userId != null ? { id: ctx.auth.userId } : false,
    ),
  }),
  actions: {
    read: { globalRoles: ['user'] },
    create: { globalRoles: ['admin'] },
    update: { globalRoles: ['admin'] },
    delete: { globalRoles: ['admin'] },
  },
});
