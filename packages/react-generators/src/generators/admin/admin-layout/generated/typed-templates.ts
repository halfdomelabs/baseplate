import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { authHooksImportsProvider } from '#src/generators/auth/_providers/auth-hooks.js';
import { authErrorsImportsProvider } from '#src/generators/auth/auth-errors/generated/ts-import-providers.js';
import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';

const adminRoute = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    authErrorsImports: authErrorsImportsProvider,
    authHooksImports: authHooksImportsProvider,
  },
  name: 'admin-route',
  projectExports: { Route: {} },
  referencedGeneratorTemplates: { adminLayout: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/routes/route.tsx'),
  },
  variables: {
    TPL_LOGIN_URL_PATH: {},
    TPL_REQUIRED_ROLES: {},
    TPL_ROUTE_PATH: {},
  },
});

const adminLayout = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'admin-layout',
  referencedGeneratorTemplates: { appBreadcrumbs: {}, appSidebar: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/layouts/admin-layout.tsx',
    ),
  },
  variables: {},
});

const appBreadcrumbs = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'app-breadcrumbs',
  projectExports: {},
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/layouts/app-breadcrumbs.tsx',
    ),
  },
  variables: {},
});

const appSidebar = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    authHooksImports: authHooksImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'app-sidebar',
  projectExports: {},
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/layouts/app-sidebar.tsx',
    ),
  },
  variables: { TPL_SIDEBAR_LINKS: {} },
});

export const mainGroup = { adminLayout, appBreadcrumbs, appSidebar };

export const ADMIN_ADMIN_LAYOUT_TEMPLATES = { adminRoute, mainGroup };
