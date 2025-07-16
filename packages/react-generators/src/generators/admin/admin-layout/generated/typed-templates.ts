import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

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
      '../templates/components/admin-layout/admin-layout.tsx',
    ),
  },
  variables: { TPL_SIDEBAR_LINKS: {} },
});

const adminRoute = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'admin-route',
  projectExports: { Route: {} },
  referencedGeneratorTemplates: { adminLayout: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/routes/route.tsx'),
  },
  variables: { TPL_LOGIN_URL_PATH: {}, TPL_ROUTE_PATH: {} },
});

export const ADMIN_ADMIN_LAYOUT_TEMPLATES = { adminLayout, adminRoute };
