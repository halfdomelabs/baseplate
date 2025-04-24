import { createTsTemplateFile } from '@halfdomelabs/core-generators';

import { authContextImportsProvider } from '../../auth-context/generated/ts-import-maps.js';

const userSessionTypes = createTsTemplateFile({
  importMapProviders: { authContextImports: authContextImportsProvider },
  name: 'user-session-types',
  projectExports: {
    UserSessionPayload: { isTypeOnly: true },
    UserSessionService: { isTypeOnly: true },
  },
  source: { path: 'user-session.types.ts' },
  variables: {},
});

export const AUTH_USER_SESSION_TYPES_TS_TEMPLATES = { userSessionTypes };
