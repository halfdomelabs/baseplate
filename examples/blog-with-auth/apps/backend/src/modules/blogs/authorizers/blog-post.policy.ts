import { prisma } from '@src/services/prisma.js';
import { createModelPolicy } from '@src/utils/authorizers/create-model-policy.js';

import { blogPolicy } from './blog.policy.js';

export const blogPostPolicy = createModelPolicy({
  model: 'blogPost',
  id: ['id'],
  delegate: prisma.blogPost,
  roles: (r) => ({
    owner: r.via(blogPolicy, 'owner', {
      relation: 'blog',
      keys: { blogId: 'id' },
    }),
  }),
  actions: {
    read: { globalRoles: ['user'] },
    create: { globalRoles: ['admin'] },
    update: { globalRoles: ['admin'] },
    delete: { globalRoles: ['admin'] },
  },
});
