import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  authHooksImportsProvider,
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import path from 'node:path';

const auth0Callback = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'pages',
  importMapProviders: {
    authHooksImports: authHooksImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'auth0-callback',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/routes/auth0-callback.tsx',
    ),
  },
  variables: {},
});

const login = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'pages',
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'login',
  source: {
    path: path.join(import.meta.dirname, '../templates/routes/login.tsx'),
  },
  variables: {},
});

export const pagesGroup = { login };

export const AUTH0_AUTH0_PAGES_TEMPLATES = { pagesGroup };
