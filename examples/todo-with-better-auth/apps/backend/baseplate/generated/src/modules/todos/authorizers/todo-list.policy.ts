import { prisma } from '@src/services/prisma.js';
import { createModelPolicy } from '@src/utils/authorizers.js';

export const todoListPolicy = createModelPolicy({
  model: 'todoList',
  idField: 'id',
  delegate: prisma.todoList,
  roles: (r) => ({
    owner: r.userMatch((session) => ({ ownerId: session.userId })),
  }),
  actions: {
    read: { roles: ['owner'], globalRoles: ['admin'] },
    create: { globalRoles: ['user'] },
    update: { globalRoles: ['user'] },
    delete: { globalRoles: ['user'] },
  },
});
