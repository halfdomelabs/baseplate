import { prisma } from '@src/services/prisma.js';
import { createModelPolicy } from '@src/utils/authorizers/create-model-policy.js';

export const blogUserPolicy = createModelPolicy({
  model: 'blogUser',
  id: ['blogId', 'userId'],
  delegate: prisma.blogUser,
  roles: (r) => ({
    owner: r.userMatch((session) => ({ userId: session.userId })),
  }),
  actions: { read: {} },
});
