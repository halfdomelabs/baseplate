import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';
import { reactErrorImportsProvider } from '#src/generators/core/react-error/generated/ts-import-providers.js';

const listPage = createTsTemplateFile({
  fileOptions: { generatorTemplatePath: 'index.page.tsx', kind: 'instance' },
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'list-page',
  source: {
    path: path.join(import.meta.dirname, '../templates/index.page.tsx'),
  },
  variables: {
    TPL_CREATE_BUTTON: {},
    TPL_DATA_LOADER: {},
    TPL_DATA_PARTS: {},
    TPL_DELETE_FUNCTION: {},
    TPL_DELETE_MUTATION: {},
    TPL_ERROR_PARTS: {},
    TPL_PAGE_NAME: {},
    TPL_PLURAL_MODEL: {},
    TPL_REFETCH_DOCUMENT: {},
    TPL_ROW_FRAGMENT_NAME: {},
    TPL_TABLE_COMPONENT: {},
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
    TPL_COMPONENT_NAME: {},
    TPL_DESTRUCTURED_PROPS: {},
    TPL_EXTRA_PROPS: {},
    TPL_HEADERS: {},
    TPL_PLURAL_MODEL: {},
    TPL_ROW_FRAGMENT: {},
  },
});

export const ADMIN_ADMIN_CRUD_LIST_TEMPLATES = { listPage, table };
