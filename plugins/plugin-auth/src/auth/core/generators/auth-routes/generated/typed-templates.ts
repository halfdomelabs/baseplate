import {
  createTextTemplateFile,
  createTsTemplateFile,
} from '@baseplate-dev/core-generators';
import {
  apolloErrorImportsProvider,
  generatedGraphqlImportsProvider,
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import path from 'node:path';

import { reactSessionImportsProvider } from '#src/auth/core/generators/react-session/generated/ts-import-providers.js';

const login = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    apolloErrorImports: apolloErrorImportsProvider,
    generatedGraphqlImports: generatedGraphqlImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
    reactSessionImports: reactSessionImportsProvider,
  },
  name: 'login',
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
    generatedGraphqlImports: generatedGraphqlImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
    reactSessionImports: reactSessionImportsProvider,
  },
  name: 'register',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/routes/auth_/register.tsx',
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

export const mainGroup = { login, register, route };

const queriesGql = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'queries-gql',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/routes/auth_/queries.gql',
    ),
  },
  variables: {},
});

export const AUTH_CORE_AUTH_ROUTES_TEMPLATES = { mainGroup, queriesGql };
