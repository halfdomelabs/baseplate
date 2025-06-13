import { createTsTemplateFile } from '@baseplate-dev/core-generators';

import { reactComponentsImportsProvider } from '../../../core/react-components/index.js';
import { reactErrorImportsProvider } from '../../../core/react-error/index.js';

const embeddedForm = createTsTemplateFile({
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'embedded-form',
  projectExports: {},
  source: { path: 'EmbeddedForm.tsx' },
  fileOptions: { kind: 'instance', generatorTemplatePath: 'EmbeddedForm.tsx' },
  variables: {
    TPL_COMPONENT_NAME: {},
    TPL_DESTRUCTURED_PROPS: {},
    TPL_EMBEDDED_FORM_DATA_SCHEMA: {},
    TPL_EMBEDDED_FORM_DATA_TYPE: {},
    TPL_HEADER: {},
    TPL_INPUTS: {},
    TPL_PROPS: {},
    TPL_TABLE_COMPONENT: {},
  },
});

export const ADMIN_ADMIN_CRUD_EMBEDDED_FORM_TS_TEMPLATES = { embeddedForm };
