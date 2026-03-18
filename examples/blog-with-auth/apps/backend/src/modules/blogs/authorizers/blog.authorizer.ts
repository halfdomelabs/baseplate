import { prisma } from '@src/services/prisma.js';
import { createModelAuthorizer } from '@src/utils/authorizers.js';

export const blogAuthorizer = createModelAuthorizer({
  model: 'blog',
  idField: 'id',
  getModelById: (id) => prisma.blog.findUnique({ where: { id } }),
  roles: {
    owner: (ctx, model) => model.userId === ctx.auth.userId,
    viewer: async (ctx, model) =>
      ctx.auth.userId != null
        ? (await prisma.blogUser.count({
            where: { blogId: model.id, userId: ctx.auth.userId },
          })) > 0
        : false,
  },
});
