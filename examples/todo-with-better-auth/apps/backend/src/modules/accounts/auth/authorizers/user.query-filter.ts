import { createModelQueryFilter } from '@src/utils/query-filters.js';

export const userQueryFilter = createModelQueryFilter({
  model: 'user',
  roles: {
    owner: (ctx) => (ctx.auth.userId != null ? { id: ctx.auth.userId } : false),
  },
});
