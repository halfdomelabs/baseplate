import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  authHooksImportsProvider,
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import path from 'node:path';

const auth0CallbackPage = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    authHooksImports: authHooksImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'auth0-callback-page',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/routes/auth0-callback.page.tsx',
    ),
  },
  variables: {},
});

const signupPage = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'signup-page',
  source: {
    path: path.join(import.meta.dirname, '../templates/routes/signup.page.tsx'),
  },
  variables: {},
});

export const AUTH0_AUTH0_CALLBACK_TEMPLATES = { auth0CallbackPage, signupPage };
