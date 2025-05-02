import { createTsTemplateFile } from '@halfdomelabs/core-generators';

import { reactComponentsImportsProvider } from '../../../core/react-components/generated/ts-import-maps.js';
import { reactErrorImportsProvider } from '../../../core/react-error/generated/ts-import-maps.js';

const embeddedForm = createTsTemplateFile({
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'admin-crud-embedded-form',
  projectExports: {},
  source: { path: 'EmbeddedForm.tsx' },
  variables: {
    TPL_COMPONENT_NAME: {},
    TPL_EMBEDDED_FORM_DATA_TYPE: {},
    TPL_EMBEDDED_FORM_DATA_SCHEMA: {},
    TPL_INPUTS: {},
    TPL_HEADER: {},
    TPL_DESTRUCTURED_PROPS: {},
    TPL_PROPS: {},
    TPL_TABLE_COMPONENT: {},
  },
});

export const ADMIN_CRUD_EMBEDDED_FORM_TS_TEMPLATES = {
  embeddedForm,
};
