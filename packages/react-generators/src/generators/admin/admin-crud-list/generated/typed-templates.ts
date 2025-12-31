import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { graphqlImportsProvider } from '#src/generators/apollo/react-apollo/providers/graphql-imports.js';
import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';

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
  fileOptions: { generatorTemplatePath: 'table.tsx', kind: 'instance' },
  importMapProviders: {
    graphqlImports: graphqlImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'table',
  source: {
    path: path.join(import.meta.dirname, '../templates/table.tsx'),
  },
  variables: {
    TPL_ACTION_HOOKS: {},
    TPL_ACTION_SIBLING_COMPONENTS: {},
    TPL_CELLS: {},
    TPL_COMPONENT_NAME: { type: 'replacement' },
    TPL_DELETE_MUTATION: {},
    TPL_DESTRUCTURED_PROPS: {},
    TPL_EXTRA_PROPS: {},
    TPL_HEADERS: {},
    TPL_PLURAL_MODEL: {},
    TPL_ROW_FRAGMENT: {},
  },
});

export const ADMIN_ADMIN_CRUD_LIST_TEMPLATES = { listPage, table };
