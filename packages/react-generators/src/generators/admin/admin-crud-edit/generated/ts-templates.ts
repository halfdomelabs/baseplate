import { createTsTemplateFile } from '@halfdomelabs/core-generators';

import { reactComponentsImportsProvider } from '../../../core/react-components/generated/ts-import-maps.js';
import { reactErrorImportsProvider } from '../../../core/react-error/generated/ts-import-maps.js';

const createPage = createTsTemplateFile({
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'admin-crud-edit-create',
  projectExports: {},
  source: { path: 'create.page.tsx' },
  variables: {
    TPL_COMPONENT_NAME: {},
    TPL_DATA_LOADER: {},
    TPL_CREATE_MUTATION: {},
    TPL_MUTATION_NAME: {},
    TPL_FORM_DATA_NAME: {},
    TPL_MODEL_NAME: {},
    TPL_REFETCH_DOCUMENT: {},
    TPL_DATA_GATE: {},
    TPL_EDIT_FORM: {},
  },
});

const editPage = createTsTemplateFile({
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'admin-crud-edit-edit',
  projectExports: {},
  source: { path: 'edit.page.tsx' },
  variables: {
    TPL_COMPONENT_NAME: {},
    TPL_DATA_LOADER: {},
    TPL_UPDATE_MUTATION: {},
    TPL_MUTATION_NAME: {},
    TPL_FORM_DATA_NAME: {},
    TPL_MODEL_NAME: {},
    TPL_DATA_GATE: {},
    TPL_EDIT_FORM: {},
  },
});

const editForm = createTsTemplateFile({
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'admin-crud-edit-form',
  projectExports: {},
  source: { path: 'EditForm.tsx' },
  variables: {
    TPL_COMPONENT_NAME: {},
    TPL_FORM_DATA_NAME: {},
    TPL_EDIT_SCHEMA: {},
    TPL_INPUTS: {},
    TPL_HEADER: {},
    TPL_EXTRA_PROPS: {},
    TPL_DESTRUCTURED_PROPS: {},
  },
});

const schema = createTsTemplateFile({
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'admin-crud-edit-schema',
  projectExports: {},
  source: { path: 'schema.ts' },
  variables: {
    TPL_SCHEMA_NAME: {},
    TPL_SCHEMA_OBJECT: {},
    TPL_FORM_DATA_NAME: {},
  },
});

export const ADMIN_CRUD_EDIT_TS_TEMPLATES = {
  createPage,
  editPage,
  editForm,
  schema,
};
