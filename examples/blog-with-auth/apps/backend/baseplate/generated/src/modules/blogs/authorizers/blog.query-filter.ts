import { createModelQueryFilter } from '@src/utils/query-filters.js';

export const blogQueryFilter = createModelQueryFilter({
  model: 'blog',
  roles: {
    owner: (ctx) =>
      ctx.auth.userId != null ? { userId: ctx.auth.userId } : false,
    viewer: (ctx) =>
      ctx.auth.userId != null
        ? { members: { some: { userId: ctx.auth.userId } } }
        : false,
  },
});
