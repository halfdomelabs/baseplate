import { builder } from '@src/plugins/graphql/builder.js';
import { prisma } from '@src/services/prisma.js';

import { userObjectType } from '../../users/schema/user.object-type.js';

builder.queryField('viewer', (t) =>
  t.prismaField({
    type: /* TPL_USER_OBJECT_TYPE:START */ userObjectType /* TPL_USER_OBJECT_TYPE:END */,
    nullable: true,
    description: 'The currently authenticated user',
    authorize: ['public'],
    resolve: async (query, root, args, { auth }) => {
      if (!auth.session || auth.session.type !== 'user') {
        return null;
      }
      return prisma.user.findUnique({
        where: { id: auth.session.userId },
        ...query,
      });
    },
  }),
);
