import { createTsTemplateFile } from '@halfdomelabs/core-generators';

import { reactComponentsImportsProvider } from '../../../core/react-components/generated/ts-import-maps.js';

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
