import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import { reactComponentsImportsProvider } from '@baseplate-dev/react-generators';

const requireAuth = createTsTemplateFile({
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'require-auth',
  projectExports: { RequireAuth: { exportName: 'default' } },
  source: { path: 'RequireAuth.tsx' },
  variables: {},
});

export const AUTH_0_AUTH_0_COMPONENTS_TS_TEMPLATES = { requireAuth };
