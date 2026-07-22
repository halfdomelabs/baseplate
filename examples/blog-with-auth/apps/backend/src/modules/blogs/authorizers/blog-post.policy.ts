import { prisma } from '@src/services/prisma.js';
import { createModelPolicy } from '@src/utils/authorizers.js';

import { blogPolicy } from './blog.policy.js';

export const blogPostPolicy = createModelPolicy({
  model: 'blogPost',
  idField: 'id',
  delegate: prisma.blogPost,
  roles: (r) => ({
    owner: r.via(blogPolicy, 'owner', { fk: 'blogId', relation: 'blog' }),
  }),
  actions: {
    read: { globalRoles: ['user'] },
    create: { globalRoles: ['admin'] },
    update: { globalRoles: ['admin'] },
    delete: { globalRoles: ['admin'] },
  },
});
