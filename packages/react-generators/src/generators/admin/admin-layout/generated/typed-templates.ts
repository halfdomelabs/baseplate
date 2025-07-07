import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { authComponentsImportsProvider } from '#src/generators/auth/_providers/auth-components.js';
import { authHooksImportsProvider } from '#src/generators/auth/_providers/auth-hooks.js';
import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';

const adminLayout = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    authHooksImports: authHooksImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'admin-layout',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/admin-layout/admin-layout.tsx',
    ),
  },
  variables: { TPL_SIDEBAR_LINKS: {} },
});

const adminRoute = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { authComponentsImports: authComponentsImportsProvider },
  name: 'admin-route',
  projectExports: { Route: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/routes/route.tsx'),
  },
  variables: { TPL_ROUTE_PATH: {} },
});

export const ADMIN_ADMIN_LAYOUT_TEMPLATES = { adminRoute, adminLayout };
