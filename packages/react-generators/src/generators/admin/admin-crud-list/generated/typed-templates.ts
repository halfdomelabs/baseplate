import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';
import { reactErrorImportsProvider } from '#src/generators/core/react-error/generated/ts-import-providers.js';

const listPage = createTsTemplateFile({
  fileOptions: { generatorTemplatePath: 'index.tsx', kind: 'instance' },
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'list-page',
  source: {
    path: path.join(import.meta.dirname, '../templates/index.tsx'),
  },
  variables: {
    TPL_CREATE_BUTTON: {},
    TPL_DATA_LOADER: {},
    TPL_DATA_PARTS: {},
    TPL_ERROR_PARTS: {},
    TPL_PAGE_NAME: {},
    TPL_ROUTE_PATH: {},
    TPL_TABLE_COMPONENT: {},
    TPL_TITLE: {},
  },
});

const table = createTsTemplateFile({
  fileOptions: { generatorTemplatePath: 'Table.tsx', kind: 'instance' },
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'table',
  source: {
    path: path.join(import.meta.dirname, '../templates/Table.tsx'),
  },
  variables: {
    TPL_CELLS: {},
    TPL_COMPONENT_NAME: { type: 'replacement' },
    TPL_DELETE_METHOD: { type: 'replacement' },
    TPL_DELETE_MUTATION: { type: 'replacement' },
    TPL_DESTRUCTURED_PROPS: {},
    TPL_EDIT_ROUTE: {},
    TPL_EXTRA_PROPS: {},
    TPL_HEADERS: {},
    TPL_PLURAL_MODEL: {},
    TPL_REFETCH_DOCUMENT: { type: 'replacement' },
    TPL_ROW_FRAGMENT: { type: 'replacement' },
  },
});

export const ADMIN_ADMIN_CRUD_LIST_TEMPLATES = { listPage, table };
