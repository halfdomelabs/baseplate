import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';

const appRoutes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'app-routes',
  projectExports: { AppRoutes: {}, router: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/app/app-routes.tsx'),
  },
  variables: {
    TPL_ADDITIONAL_ROUTER_OPTIONS: {},
    TPL_COMPONENT_BODY: {},
    TPL_COMPONENT_SETUP: {},
    TPL_ROUTER_PROVIDER: {},
  },
});

const placeholderIndex = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
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
  projectExports: { Route: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/routes/__root.tsx'),
  },
  variables: { TPL_ROOT_ROUTE_CONTEXT: {}, TPL_ROOT_ROUTE_OPTIONS: {} },
});

const routeTree = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'route-tree',
  source: {
    path: path.join(import.meta.dirname, '../templates/src/route-tree.gen.ts'),
  },
  variables: {},
});

export const CORE_REACT_ROUTER_TEMPLATES = {
  rootRoute,
  placeholderIndex,
  appRoutes,
  routeTree,
};
