// @ts-nocheck

import { userSessionPayload } from '$schemaUserSessionPayloadObjectType';
import { builder } from '%pothosImports';

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
