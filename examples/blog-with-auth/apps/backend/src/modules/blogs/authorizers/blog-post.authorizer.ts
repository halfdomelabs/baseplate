import { prisma } from '@src/services/prisma.js';
import { createModelAuthorizer } from '@src/utils/authorizers.js';

import { blogAuthorizer } from './blog.authorizer.js';

export const blogPostAuthorizer = createModelAuthorizer({
  model: 'blogPost',
  idField: 'id',
  getModelById: (id) => prisma.blogPost.findUnique({ where: { id } }),
  roles: {
    owner: async (ctx, model) =>
      await blogAuthorizer.hasRoleById(ctx, model.blogId, 'owner'),
  },
});
