import {
  createTsTemplateFile,
  createTsTemplateGroup,
} from '@baseplate-dev/core-generators';

import { errorHandlerServiceImportsProvider } from '../../../core/error-handler-service/generated/ts-import-providers.js';
import { authRolesImportsProvider } from '../../auth-roles/index.js';

const authContextTypes = createTsTemplateFile({
  group: 'main',
  importMapProviders: { authRolesImports: authRolesImportsProvider },
  name: 'auth-context-types',
  projectExports: { AuthContext: { isTypeOnly: true } },
  source: { path: 'types/auth-context.types.ts' },
  variables: {},
});

const authContextUtils = createTsTemplateFile({
  group: 'main',
  importMapProviders: {
    authRolesImports: authRolesImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
  },
  name: 'auth-context-utils',
  projectExports: { createAuthContextFromSessionInfo: {} },
  source: { path: 'utils/auth-context.utils.ts' },
  variables: {},
});

const authSessionTypes = createTsTemplateFile({
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
  source: { path: 'types/auth-session.types.ts' },
  variables: {},
});

const mainGroup = createTsTemplateGroup({
  templates: {
    authContextTypes: {
      destination: 'types/auth-context.types.ts',
      template: authContextTypes,
    },
    authContextUtils: {
      destination: 'utils/auth-context.utils.ts',
      template: authContextUtils,
    },
    authSessionTypes: {
      destination: 'types/auth-session.types.ts',
      template: authSessionTypes,
    },
  },
});

export const AUTH_AUTH_CONTEXT_TS_TEMPLATES = { mainGroup };
