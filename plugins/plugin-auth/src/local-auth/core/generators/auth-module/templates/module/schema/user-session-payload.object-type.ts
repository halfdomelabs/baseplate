// @ts-nocheck

import { authRoleEnum } from '$authRoleEnum';
import { builder } from '%pothosImports';

export const userSessionPayload = builder.simpleObject(
  'UserSessionPayload',
  {
    fields: (t) => ({
      expiresAt: t.field({ type: 'DateTime', nullable: true }),
      userId: t.field({ type: 'Uuid' }),
      roles: t.field({ type: [authRoleEnum] }),
    }),
  },
  (t) => ({
    user: t.prismaField({
      type: TPL_USER_OBJECT_TYPE,
      resolve: async (query, root) =>
        TPL_PRISMA_USER.findUniqueOrThrow({
          where: { id: root.userId },
          ...query,
        }),
    }),
  }),
);
