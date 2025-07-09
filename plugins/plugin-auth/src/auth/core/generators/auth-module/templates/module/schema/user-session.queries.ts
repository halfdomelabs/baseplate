// @ts-nocheck

import { builder } from '%pothosImports';

import { userSessionPayload } from './user-session-payload.object-type.js';

builder.queryField('currentUserSession', (t) =>
  t.field({
    type: userSessionPayload,
    description: 'Get the current user session',
    nullable: true,
    authorize: ['public'],
    resolve: (root, args, { auth }) => {
      if (!auth.session || auth.session.type !== 'user') {
        return undefined;
      }

      return {
        expiresAt: auth.session.expiresAt?.toISOString(),
        userId: auth.session.userId,
      };
    },
  }),
);
