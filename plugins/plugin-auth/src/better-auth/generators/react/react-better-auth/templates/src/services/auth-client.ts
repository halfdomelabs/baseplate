// @ts-nocheck

import { inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  // The /api prefix is rewritten to / by the Vite dev proxy (and reverse proxy in production).
  // The backend registers Better Auth routes at /auth/*.
  basePath: '/api/auth',
  plugins: [
    inferAdditionalFields({
      session: { roles: { type: 'string[]' } },
    }),
  ],
});
