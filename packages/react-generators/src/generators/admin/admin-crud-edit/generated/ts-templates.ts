import { createTsTemplateFile } from '@halfdomelabs/core-generators';

import { reactComponentsImportsProvider } from '../../../core/react-components/generated/ts-import-maps.js';
import { reactErrorImportsProvider } from '../../../core/react-error/generated/ts-import-maps.js';

const createPage = createTsTemplateFile({
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'create-page',
  projectExports: {},
  source: { path: 'create.page.tsx' },
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
  },
});

const editForm = createTsTemplateFile({
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'edit-form',
  projectExports: {},
  source: { path: 'EditForm.tsx' },
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
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'edit-page',
  projectExports: {},
  source: { path: 'edit.page.tsx' },
  variables: {
    TPL_COMPONENT_NAME: {},
    TPL_DATA_GATE: {},
    TPL_DATA_LOADER: {},
    TPL_EDIT_FORM: {},
    TPL_FORM_DATA_NAME: {},
    TPL_MODEL_NAME: {},
    TPL_MUTATION_NAME: {},
    TPL_UPDATE_MUTATION: {},
  },
});

const schema = createTsTemplateFile({
  name: 'schema',
  projectExports: {},
  source: { path: 'schema.ts' },
  variables: {
    TPL_FORM_DATA_NAME: {},
    TPL_SCHEMA_NAME: {},
    TPL_SCHEMA_OBJECT: {},
  },
});

export const ADMIN_ADMIN_CRUD_EDIT_TS_TEMPLATES = {
  createPage,
  editForm,
  editPage,
  schema,
};
