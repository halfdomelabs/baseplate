import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';
import { reactErrorImportsProvider } from '#src/generators/core/react-error/generated/ts-import-providers.js';

const embeddedForm = createTsTemplateFile({
  fileOptions: { generatorTemplatePath: 'EmbeddedForm.tsx', kind: 'instance' },
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'embedded-form',
  source: {
    path: path.join(import.meta.dirname, '../templates/EmbeddedForm.tsx'),
  },
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

export const ADMIN_ADMIN_CRUD_EMBEDDED_FORM_TEMPLATES = { embeddedForm };
