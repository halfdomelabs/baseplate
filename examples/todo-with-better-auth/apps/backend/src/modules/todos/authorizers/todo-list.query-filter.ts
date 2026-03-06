import { createModelQueryFilter } from '@src/utils/query-filters.js';

export const todoListQueryFilter = createModelQueryFilter({
  model: 'todoList',
  roles: { owner: (ctx) => ({ ownerId: ctx.auth.userId }) },
});
