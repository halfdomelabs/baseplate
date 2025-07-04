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
  variables: { TPL_RENDER_HEADER: {} },
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

const routeTree = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'route-tree',
  source: {
    path: path.join(import.meta.dirname, '../templates/src/route-tree.gen.ts'),
  },
  variables: {},
});

export const CORE_REACT_ROUTER_TEMPLATES = {
  placeholderIndex,
  appRoutes,
  routeTree,
};
