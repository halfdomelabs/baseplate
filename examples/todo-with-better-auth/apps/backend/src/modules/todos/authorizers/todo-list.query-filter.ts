import { createModelQueryFilter } from '@src/utils/query-filters.js';

export const todoListQueryFilter = createModelQueryFilter({
  model: 'todoList',
  roles: {
    owner: (ctx) =>
      ctx.auth.userId != null ? { ownerId: ctx.auth.userId } : false,
  },
});
