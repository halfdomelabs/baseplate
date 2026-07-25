import { prisma } from '@src/services/prisma.js';
import { createModelPolicy } from '@src/utils/authorizers.js';

export const userPolicy = createModelPolicy({
  model: 'user',
  idField: 'id',
  delegate: prisma.user,
  roles: (r) => ({ self: r.userMatch((session) => ({ id: session.userId })) }),
  actions: {
    read: { globalRoles: ['user', 'admin'] },
    create: { globalRoles: ['admin'] },
    update: { globalRoles: ['admin'] },
    delete: { globalRoles: ['admin'] },
  },
});
