import { createModelQueryFilter } from '@src/utils/query-filters.js';

export const blogQueryFilter = createModelQueryFilter({
  model: 'blog',
  roles: { owner: (ctx) => ({ userId: ctx.auth.userId }) },
});
