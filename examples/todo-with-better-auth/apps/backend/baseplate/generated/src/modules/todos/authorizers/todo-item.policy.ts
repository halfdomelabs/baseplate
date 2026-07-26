import { prisma } from '@src/services/prisma.js';
import { createModelPolicy } from '@src/utils/authorizers/create-model-policy.js';

import { todoListPolicy } from './todo-list.policy.js';

export const todoItemPolicy = createModelPolicy({
  model: 'todoItem',
  id: 'id',
  delegate: prisma.todoItem,
  roles: (r) => ({
    owner: r.some([
      r.via(todoListPolicy, 'owner', {
        relation: 'todoList',
        keys: { todoListId: 'id' },
      }),
      r.hasRole('admin'),
    ]),
  }),
  actions: {
    read: { globalRoles: ['user'] },
    create: { globalRoles: ['user'] },
    update: { roles: ['owner'], globalRoles: ['admin'] },
    delete: { roles: ['owner'], globalRoles: ['admin'] },
  },
});
