import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  apolloErrorImportsProvider,
  graphqlImportsProvider,
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import path from 'node:path';

import { reactSessionImportsProvider } from '#src/local-auth/core/generators/react-session/generated/ts-import-providers.js';

const constants = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'constants',
  projectExports: {
    PASSWORD_MAX_LENGTH: { isTypeOnly: false },
    PASSWORD_MIN_LENGTH: { isTypeOnly: false },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/routes/auth_/-constants.ts',
    ),
  },
  variables: {},
});

const forgotPassword = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    graphqlImports: graphqlImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'forgot-password',
  referencedGeneratorTemplates: { constants: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/routes/auth_/forgot-password.tsx',
    ),
  },
  variables: {},
});

const login = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    apolloErrorImports: apolloErrorImportsProvider,
    graphqlImports: graphqlImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
    reactSessionImports: reactSessionImportsProvider,
  },
  name: 'login',
  referencedGeneratorTemplates: { constants: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/routes/auth_/login.tsx'),
  },
  variables: {},
});

const register = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    apolloErrorImports: apolloErrorImportsProvider,
    graphqlImports: graphqlImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
    reactSessionImports: reactSessionImportsProvider,
  },
  name: 'register',
  referencedGeneratorTemplates: { constants: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/routes/auth_/register.tsx',
    ),
  },
  variables: {},
});

const resetPassword = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    apolloErrorImports: apolloErrorImportsProvider,
    graphqlImports: graphqlImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'reset-password',
  referencedGeneratorTemplates: { constants: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/routes/auth_/reset-password.tsx',
    ),
  },
  variables: {},
});

const route = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'route',
  source: {
    path: path.join(import.meta.dirname, '../templates/routes/auth_/route.tsx'),
  },
  variables: {},
});

export const mainGroup = {
  constants,
  forgotPassword,
  login,
  register,
  resetPassword,
  route,
};

export const AUTH_CORE_AUTH_ROUTES_TEMPLATES = { mainGroup };
