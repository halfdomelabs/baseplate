import { builder } from '@src/plugins/graphql/builder.js';
import { prisma } from '@src/services/prisma.js';

import { userSessionPayload } from './user-session-payload.object-type.js';
import { userObjectType } from './user.object-type.js';

builder.queryField('currentUserSession', (t) =>
  t.field({
    type: userSessionPayload,
    description: 'Get the current user session',
    nullable: true,
    authorize: ['public'],
    resolve: (root, args, { auth }) => {
      if (auth.session?.type !== 'user') {
        return undefined;
      }

      return {
        expiresAt: auth.session.expiresAt?.toISOString(),
        userId: auth.session.userId,
        roles: auth.roles,
      };
    },
  }),
);

builder.queryField('viewer', (t) =>
  t.prismaField({
    type: /* TPL_USER_OBJECT_TYPE:START */ userObjectType /* TPL_USER_OBJECT_TYPE:END */,
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
