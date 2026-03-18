import { builder } from '@src/plugins/graphql/builder.js';
import { prisma } from '@src/services/prisma.js';

import { userObjectType } from '../../users/schema/user.object-type.js';
import { authRoleEnum } from './auth-role.enum.js';

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
      type: /* TPL_USER_OBJECT_TYPE:START */ userObjectType /* TPL_USER_OBJECT_TYPE:END */,
      resolve: async (query, root) =>
        /* TPL_PRISMA_USER:START */ prisma.user /* TPL_PRISMA_USER:END */
          .findUniqueOrThrow({
            where: { id: root.userId },
            ...query,
          }),
    }),
  }),
);
