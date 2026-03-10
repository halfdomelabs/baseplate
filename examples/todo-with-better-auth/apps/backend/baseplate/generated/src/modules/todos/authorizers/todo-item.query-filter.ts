import { createModelQueryFilter } from '@src/utils/query-filters.js';
import { queryHelpers } from '@src/utils/query-helpers.js';

import { todoListQueryFilter } from './todo-list.query-filter.js';

export const todoItemQueryFilter = createModelQueryFilter({
  model: 'todoItem',
  roles: {
    owner: (ctx) =>
      queryHelpers.or([
        todoListQueryFilter.buildNestedWhere(ctx, 'todoList', ['owner']),
        ctx.auth.hasRole('admin'),
      ]),
  },
});
