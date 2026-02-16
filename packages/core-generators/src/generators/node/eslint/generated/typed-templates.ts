import path from 'node:path';

import { createTsTemplateFile } from '#src/renderers/typescript/templates/types.js';

const eslintConfig = createTsTemplateFile({
  fileOptions: {
    generatorTemplatePath: 'eslint.config.js',
    kind: 'singleton',
    pathRootRelativePath: '{package-root}/eslint.config.js',
  },
  importMapProviders: {},
  name: 'eslint-config',
  source: {
    path: path.join(import.meta.dirname, '../templates/eslint.config.js'),
  },
  variables: {
    TPL_DEFAULT_PROJECT_FILES: {},
    TPL_DEV_DEPENDENCIES: {},
    TPL_EXTRA_CONFIGS: {},
    TPL_GLOBALS: {},
    TPL_IGNORE_FILES: {},
    TPL_TAILWIND_CONFIG: {},
  },
});

export const NODE_ESLINT_TEMPLATES = { eslintConfig };
