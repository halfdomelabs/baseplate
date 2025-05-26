import { createTsTemplateFile } from '@halfdomelabs/core-generators';
import {
  authHooksImportsProvider,
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@halfdomelabs/react-generators';

const authCallbackPage = createTsTemplateFile({
  importMapProviders: {
    authHooksImports: authHooksImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'auth-callback-page',
  projectExports: {},
  source: { path: 'auth-callback.page.tsx' },
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
  authCallbackPage,
  signupPage,
};
