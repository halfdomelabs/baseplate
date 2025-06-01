import { createTsTemplateFile } from '@baseplate-dev/core-generators';

import { reactComponentsImportsProvider } from '../../../core/react-components/generated/ts-import-maps.js';
import { reactErrorImportsProvider } from '../../../core/react-error/generated/ts-import-maps.js';

const listPage = createTsTemplateFile({
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'list-page',
  projectExports: {},
  source: { path: 'index.page.tsx' },
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
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'table',
  projectExports: {},
  source: { path: 'Table.tsx' },
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

export const ADMIN_ADMIN_CRUD_LIST_TS_TEMPLATES = { listPage, table };
