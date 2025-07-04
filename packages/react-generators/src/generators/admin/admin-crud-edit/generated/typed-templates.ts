import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';
import { reactErrorImportsProvider } from '#src/generators/core/react-error/generated/ts-import-providers.js';

const createPage = createTsTemplateFile({
  fileOptions: { generatorTemplatePath: 'create.tsx', kind: 'instance' },
  importMapProviders: { reactErrorImports: reactErrorImportsProvider },
  name: 'create-page',
  source: {
    path: path.join(import.meta.dirname, '../templates/create.tsx'),
  },
  variables: {
    TPL_COMPONENT_NAME: {},
    TPL_CREATE_MUTATION: {},
    TPL_DATA_GATE: {},
    TPL_DATA_LOADER: {},
    TPL_EDIT_FORM: {},
    TPL_FORM_DATA_NAME: {},
    TPL_MODEL_NAME: {},
    TPL_MUTATION_NAME: {},
    TPL_REFETCH_DOCUMENT: {},
    TPL_ROUTE_VALUE: {},
  },
});

const editForm = createTsTemplateFile({
  fileOptions: { generatorTemplatePath: 'edit-form.tsx', kind: 'instance' },
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'edit-form',
  source: {
    path: path.join(import.meta.dirname, '../templates/edit-form.tsx'),
  },
  variables: {
    TPL_COMPONENT_NAME: {},
    TPL_DESTRUCTURED_PROPS: {},
    TPL_EDIT_SCHEMA: {},
    TPL_EXTRA_PROPS: {},
    TPL_FORM_DATA_NAME: {},
    TPL_HEADER: {},
    TPL_INPUTS: {},
  },
});

const editPage = createTsTemplateFile({
  fileOptions: { generatorTemplatePath: 'edit.tsx', kind: 'instance' },
  importMapProviders: { reactErrorImports: reactErrorImportsProvider },
  name: 'edit-page',
  source: {
    path: path.join(import.meta.dirname, '../templates/edit.tsx'),
  },
  variables: {
    TPL_COMPONENT_NAME: {},
    TPL_DATA_GATE: {},
    TPL_DATA_LOADER: {},
    TPL_EDIT_FORM: {},
    TPL_FORM_DATA_NAME: {},
    TPL_MODEL_NAME: {},
    TPL_MUTATION_NAME: {},
    TPL_ROUTE_VALUE: {},
    TPL_UPDATE_MUTATION: {},
  },
});

const schema = createTsTemplateFile({
  fileOptions: { generatorTemplatePath: 'schema.ts', kind: 'instance' },
  importMapProviders: {},
  name: 'schema',
  source: {
    path: path.join(import.meta.dirname, '../templates/schema.ts'),
  },
  variables: {
    TPL_FORM_DATA_NAME: {},
    TPL_SCHEMA_NAME: {},
    TPL_SCHEMA_OBJECT: {},
  },
});

export const ADMIN_ADMIN_CRUD_EDIT_TEMPLATES = {
  createPage,
  editForm,
  editPage,
  schema,
};
