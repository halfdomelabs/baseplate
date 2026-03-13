import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import path from 'node:path';

import { betterAuthImportsProvider } from '#src/better-auth/generators/react/react-better-auth/generated/ts-import-providers.js';

const login = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'pages',
  importMapProviders: {
    betterAuthImports: betterAuthImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'login',
  source: {
    path: path.join(import.meta.dirname, '../templates/routes/login.tsx'),
  },
  variables: {},
});

const register = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'pages',
  importMapProviders: {
    betterAuthImports: betterAuthImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'register',
  source: {
    path: path.join(import.meta.dirname, '../templates/routes/register.tsx'),
  },
  variables: {},
});

export const pagesGroup = { login, register };

export const BETTER_AUTH_BETTER_AUTH_PAGES_TEMPLATES = { pagesGroup };
