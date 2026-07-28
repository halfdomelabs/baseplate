import { prisma } from '@src/services/prisma.js';
import { createModelPolicy } from '@src/utils/authorizers/create-model-policy.js';

import { blogUserPolicy } from './blog-user.policy.js';

export const blogPolicy = createModelPolicy({
  model: 'blog',
  id: 'id',
  delegate: prisma.blog,
  roles: (r) => ({
    owner: r.userMatch((session) => ({ userId: session.userId })),
    viewer: r.userWhere((session) => ({
      members: { some: { userId: session.userId } },
    })),
    member: r.viaMany(blogUserPolicy, 'owner', 'members'),
  }),
  actions: {
    read: { roles: ['member'], globalRoles: ['public'] },
    update: { roles: ['owner'], globalRoles: ['admin'] },
    delete: { roles: ['owner'], globalRoles: ['admin'] },
  },
});
