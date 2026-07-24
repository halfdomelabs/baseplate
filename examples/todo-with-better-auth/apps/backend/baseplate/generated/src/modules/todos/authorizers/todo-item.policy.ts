import { prisma } from '@src/services/prisma.js';
import { createModelPolicy } from '@src/utils/authorizers.js';

import { todoListPolicy } from './todo-list.policy.js';

export const todoItemPolicy = createModelPolicy({
  model: 'todoItem',
  idField: 'id',
  delegate: prisma.todoItem,
  roles: (r) => ({
    owner: r.some([
      r.via(todoListPolicy, 'owner', {
        fk: 'todoListId',
        relation: 'todoList',
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
