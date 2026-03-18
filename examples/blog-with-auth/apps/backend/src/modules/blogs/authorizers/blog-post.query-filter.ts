import { createModelQueryFilter } from '@src/utils/query-filters.js';

import { blogQueryFilter } from './blog.query-filter.js';

export const blogPostQueryFilter = createModelQueryFilter({
  model: 'blogPost',
  roles: {
    owner: (ctx) => blogQueryFilter.buildNestedWhere(ctx, 'blog', ['owner']),
  },
});
