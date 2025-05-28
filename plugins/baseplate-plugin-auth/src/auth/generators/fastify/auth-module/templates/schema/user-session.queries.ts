// @ts-nocheck

import { builder } from '%pothosImports';

builder.queryField('currentUser', (t) =>
  t.prismaField({
    type: 'User',
    nullable: true,
    resolve: async (query, root, args, { auth }) => {
      if (!auth.userId) {
        return null;
      }

      return TPL_PRISMA_USER.findUniqueOrThrow({
        ...query,
        where: { id: auth.userId },
      });
    },
  }),
);
