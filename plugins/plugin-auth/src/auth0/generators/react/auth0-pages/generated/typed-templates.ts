import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import { reactComponentsImportsProvider } from '@baseplate-dev/react-generators';
import path from 'node:path';

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
