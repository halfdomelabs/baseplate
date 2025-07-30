import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';

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
  source: {
    path: path.join(import.meta.dirname, '../templates/routes/__root.tsx'),
  },
  variables: { TPL_ROOT_ROUTE_CONTEXT: {}, TPL_ROOT_ROUTE_OPTIONS: {} },
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
  projectExports: { AppRoutes: {}, router: {} },
  referencedGeneratorTemplates: { routeTree: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/app/router.tsx'),
  },
  variables: {
    TPL_ADDITIONAL_ROUTER_OPTIONS: {},
    TPL_COMPONENT_BODY: {},
    TPL_COMPONENT_SETUP: {},
    TPL_ERROR_COMPONENT_BODY: {},
    TPL_ERROR_COMPONENT_HEADER: {},
    TPL_ROUTER_CONTEXT: {},
    TPL_ROUTER_PROVIDER: {},
  },
});

export const CORE_REACT_ROUTER_TEMPLATES = {
  placeholderIndex,
  rootRoute,
  router,
  routeTree,
};
