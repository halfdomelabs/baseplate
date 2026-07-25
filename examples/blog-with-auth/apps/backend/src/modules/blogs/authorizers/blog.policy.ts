import { prisma } from '@src/services/prisma.js';
import { createModelPolicy } from '@src/utils/authorizers.js';

export const blogPolicy = createModelPolicy({
  model: 'blog',
  idField: 'id',
  delegate: prisma.blog,
  roles: (r) => ({
    owner: r.userMatch((session) => ({ userId: session.userId })),
    viewer: r.userWhere((session) => ({
      members: { some: { userId: session.userId } },
    })),
  }),
  actions: {
    read: { globalRoles: ['public'] },
    update: { roles: ['owner'], globalRoles: ['admin'] },
    delete: { roles: ['owner'], globalRoles: ['admin'] },
  },
});
