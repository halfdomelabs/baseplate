// @ts-nocheck

import { builder } from '%pothosImports';
import { prisma } from '%prismaImports';

builder.queryField('viewer', (t) =>
  t.prismaField({
    type: TPL_USER_OBJECT_TYPE,
    nullable: true,
    description: 'The currently authenticated user',
    authorize: ['public'],
    resolve: async (query, root, args, { auth }) => {
      if (auth.session?.type !== 'user') {
        return null;
      }
      return prisma.user.findUnique({
        where: { id: auth.session.userId },
        ...query,
      });
    },
  }),
);
