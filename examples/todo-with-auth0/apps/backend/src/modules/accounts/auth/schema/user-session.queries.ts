import { builder } from '@src/plugins/graphql/builder.js';
import { prisma } from '@src/services/prisma.js';

builder.queryField('viewer', (t) =>
  t.prismaField({
    type: 'User',
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
