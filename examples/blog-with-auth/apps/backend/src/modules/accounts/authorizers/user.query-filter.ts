import { createModelQueryFilter } from '@src/utils/query-filters.js';

export const userQueryFilter = createModelQueryFilter({
  model: 'user',
  roles: { owner: (ctx) => ({ id: ctx.auth.userId }) },
});
