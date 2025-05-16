import { createTsTemplateFile } from '@halfdomelabs/core-generators';
import {
  authHooksImportsProvider,
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@halfdomelabs/react-generators';

const auth0CallbackPage = createTsTemplateFile({
  importMapProviders: {
    authHooksImports: authHooksImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'auth0-callback-page',
  projectExports: {},
  source: { path: 'auth0-callback.page.tsx' },
  variables: {},
});

const signupPage = createTsTemplateFile({
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'signup-page',
  projectExports: {},
  source: { path: 'signup.page.tsx' },
  variables: {},
});

export const AUTH_0_AUTH_0_CALLBACK_TS_TEMPLATES = {
  auth0CallbackPage,
  signupPage,
};
