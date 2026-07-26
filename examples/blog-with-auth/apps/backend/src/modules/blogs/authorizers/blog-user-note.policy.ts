import { prisma } from '@src/services/prisma.js';
import { createModelPolicy } from '@src/utils/authorizers/create-model-policy.js';

import { blogUserPolicy } from './blog-user.policy.js';

export const blogUserNotePolicy = createModelPolicy({
  model: 'blogUserNote',
  id: ['id'],
  delegate: prisma.blogUserNote,
  roles: (r) => ({
    owner: r.via(blogUserPolicy, 'owner', {
      relation: 'blogUser',
      keys: { blogId: 'blogId', userId: 'userId' },
    }),
  }),
  actions: { read: {} },
});
