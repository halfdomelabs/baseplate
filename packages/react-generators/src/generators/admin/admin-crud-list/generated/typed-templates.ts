import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { graphqlImportsProvider } from '#src/generators/apollo/react-apollo/providers/graphql-imports.js';
import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';

const listPage = createTsTemplateFile({
  fileOptions: { generatorTemplatePath: 'index.tsx', kind: 'instance' },
  importMapProviders: {},
  name: 'list-page',
  source: {
    path: path.join(import.meta.dirname, '../templates/index.tsx'),
  },
  variables: {
    TPL_COMPONENT_NAME: { type: 'replacement' },
    TPL_CREATE_BUTTON: {},
    TPL_DATA_LOADERS: {},
    TPL_ITEMS_QUERY: {},
    TPL_PAGE_TITLE: {},
    TPL_ROUTE_PATH: {},
    TPL_ROUTE_PROPS: {},
    TPL_TABLE_COMPONENT: {},
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
    TPL_DESTRUCTURED_PROPS: {},
    TPL_HEADERS: {},
    TPL_ITEMS_FRAGMENT: {},
    TPL_ITEMS_FRAGMENT_NAME: { type: 'replacement' },
    TPL_PLURAL_MODEL: {},
    TPL_PROPS: {},
  },
});

export const ADMIN_ADMIN_CRUD_LIST_TEMPLATES = { listPage, table };
