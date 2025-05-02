import { createTsTemplateFile } from '@halfdomelabs/core-generators';

import { reactComponentsImportsProvider } from '../../../core/react-components/generated/ts-import-maps.js';
import { reactErrorImportsProvider } from '../../../core/react-error/generated/ts-import-maps.js';

const indexPage = createTsTemplateFile({
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'admin-crud-list-index',
  projectExports: {},
  source: { path: 'index.page.tsx' },
  variables: {
    TPL_PAGE_NAME: {},
    TPL_DATA_LOADER: {},
    TPL_DELETE_FUNCTION: {},
    TPL_DELETE_MUTATION: {},
    TPL_ROW_FRAGMENT_NAME: {},
    TPL_PLURAL_MODEL: {},
    TPL_CREATE_BUTTON: {},
    TPL_DATA_PARTS: {},
    TPL_ERROR_PARTS: {},
    TPL_TABLE_COMPONENT: {},
    TPL_REFETCH_DOCUMENT: {},
  },
});

const table = createTsTemplateFile({
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'admin-crud-list-table',
  projectExports: {},
  source: { path: 'Table.tsx' },
  variables: {
    TPL_COMPONENT_NAME: {},
    TPL_ROW_FRAGMENT: {},
    TPL_HEADERS: {},
    TPL_CELLS: {},
    TPL_PLURAL_MODEL: {},
    TPL_EXTRA_PROPS: {},
    TPL_DESTRUCTURED_PROPS: {},
  },
});

export const ADMIN_CRUD_LIST_TS_TEMPLATES = {
  indexPage,
  table,
};
