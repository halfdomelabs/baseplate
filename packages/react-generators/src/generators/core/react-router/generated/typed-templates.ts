import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';

const appRoutes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'app-routes',
  projectExports: { AppRoutes: { isTypeOnly: false } },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/app/app-routes.tsx'),
  },
  variables: {
    TPL_COMPONENT_BODY: {},
    TPL_COMPONENT_SETUP: {},
    TPL_ROUTER_CONTEXT: {},
    TPL_ROUTER_PROVIDER: {},
  },
});

const placeholderIndex = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'placeholder-index',
  source: {
    path: path.join(import.meta.dirname, '../templates/routes/index.tsx'),
  },
  variables: {},
});

const rootRoute = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'root-route',
  source: {
    path: path.join(import.meta.dirname, '../templates/routes/__root.tsx'),
  },
  variables: { TPL_ROOT_ROUTE_CONTEXT: {}, TPL_ROOT_ROUTE_OPTIONS: {} },
});

const routeErrorComponent = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'route-error-component',
  projectExports: { ErrorComponent: { isTypeOnly: false } },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/app/route-error-component.tsx',
    ),
  },
  variables: { TPL_ERROR_COMPONENT_BODY: {}, TPL_ERROR_COMPONENT_HEADER: {} },
});

const routeTree = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'route-tree',
  projectExportsOnly: true,
  source: { contents: '' },
  variables: {},
});

const router = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'router',
  projectExports: { router: { isTypeOnly: false } },
  referencedGeneratorTemplates: { routeErrorComponent: {}, routeTree: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/app/router.ts'),
  },
  variables: { TPL_ADDITIONAL_ROUTER_OPTIONS: {} },
});

export const CORE_REACT_ROUTER_TEMPLATES = {
  appRoutes,
  placeholderIndex,
  rootRoute,
  routeErrorComponent,
  router,
  routeTree,
};
