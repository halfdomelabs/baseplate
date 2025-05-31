// @ts-nocheck

import { builder } from '%pothosImports';

export const userSessionPayload = builder.simpleObject(
  'UserSessionPayload',
  {
    fields: (t) => ({
      expiresAt: t.field({ type: 'DateTime' }),
      userId: t.field({ type: 'Uuid' }),
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
