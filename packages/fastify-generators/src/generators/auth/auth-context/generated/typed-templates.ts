import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { authRolesImportsProvider } from '#src/generators/auth/auth-roles/generated/ts-import-providers.js';
import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';

const authContextTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: { authRolesImports: authRolesImportsProvider },
  name: 'auth-context-types',
  projectExports: { AuthContext: { isTypeOnly: true } },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/types/auth-context.types.ts',
    ),
  },
  variables: {},
});

const authContextUtils = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    authRolesImports: authRolesImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
  },
  name: 'auth-context-utils',
  projectExports: { createAuthContextFromSessionInfo: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/utils/auth-context.utils.ts',
    ),
  },
  variables: {},
});

const authSessionTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    authRolesImports: authRolesImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
  },
  name: 'auth-session-types',
  projectExports: {
    AuthSessionInfo: { isTypeOnly: true },
    AuthUserSessionInfo: { isTypeOnly: true },
    InvalidSessionError: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/types/auth-session.types.ts',
    ),
  },
  variables: {},
});

export const mainGroup = {
  authContextTypes,
  authContextUtils,
  authSessionTypes,
};

export const AUTH_AUTH_CONTEXT_TEMPLATES = { mainGroup };
