import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const index = createTsTemplateFile({
  fileOptions: { generatorTemplatePath: 'routes.tsx', kind: 'instance' },
  importMapProviders: {},
  name: 'index',
  source: {
    path: path.join(import.meta.dirname, '../templates/routes.tsx'),
  },
  variables: { TPL_ROUTE_HEADER: {}, TPL_ROUTES: {}, TPL_ROUTES_NAME: {} },
});

export const CORE_REACT_ROUTES_TEMPLATES = { index };
