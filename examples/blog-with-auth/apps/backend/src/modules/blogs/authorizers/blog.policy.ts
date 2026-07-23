import { prisma } from '@src/services/prisma.js';
import { createModelPolicy } from '@src/utils/authorizers.js';

export const blogPolicy = createModelPolicy({
  model: 'blog',
  idField: 'id',
  delegate: prisma.blog,
  roles: (r) => ({
    owner: r.match((ctx) =>
      ctx.auth.userId != null ? { userId: ctx.auth.userId } : false,
    ),
    viewer: r.where((ctx) =>
      ctx.auth.userId != null
        ? { members: { some: { userId: ctx.auth.userId } } }
        : false,
    ),
  }),
  actions: {
    read: { globalRoles: ['public'] },
    update: { roles: ['owner'], globalRoles: ['admin'] },
    delete: { roles: ['owner'], globalRoles: ['admin'] },
  },
});
