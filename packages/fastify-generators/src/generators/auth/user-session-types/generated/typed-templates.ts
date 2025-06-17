import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { authContextImportsProvider } from '#src/generators/auth/auth-context/generated/ts-import-providers.js';

const userSessionTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { authContextImports: authContextImportsProvider },
  name: 'user-session-types',
  projectExports: {
    UserSessionPayload: { isTypeOnly: true },
    UserSessionService: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/types/user-session.types.ts',
    ),
  },
  variables: {},
});

export const AUTH_USER_SESSION_TYPES_TEMPLATES = { userSessionTypes };
