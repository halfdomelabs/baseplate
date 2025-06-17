import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { authContextImportsProvider } from '#src/generators/auth/auth-context/generated/ts-import-providers.js';
import { userSessionTypesImportsProvider } from '#src/generators/auth/user-session-types/generated/ts-import-providers.js';

const userSessionService = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    authContextImports: authContextImportsProvider,
    userSessionTypesImports: userSessionTypesImportsProvider,
  },
  name: 'user-session-service',
  projectExports: { userSessionService: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/user-session.service.ts',
    ),
  },
  variables: {},
});

export const AUTH_PLACEHOLDER_AUTH_SERVICE_TEMPLATES = { userSessionService };
