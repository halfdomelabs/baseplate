import { prisma } from '@src/services/prisma.js';
import { createModelPolicy } from '@src/utils/authorizers/create-model-policy.js';

export const userProfilePolicy = createModelPolicy({
  model: 'userProfile',
  id: 'id',
  delegate: prisma.userProfile,
  roles: (r) => ({
    owner: r.userMatch((session) => ({ userId: session.userId })),
  }),
  actions: { read: {}, create: {}, update: {}, delete: {} },
});
