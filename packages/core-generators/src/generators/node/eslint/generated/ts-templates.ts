import { createTsTemplateFile } from '#src/renderers/typescript/index.js';

const eslintConfig = createTsTemplateFile({
  name: 'eslint-config',
  projectExports: {},
  source: { path: 'eslint.config.js' },
  variables: {
    TPL_DEFAULT_PROJECT_FILES: {},
    TPL_DEV_DEPENDENCIES: {},
    TPL_EXTRA_CONFIGS: {},
    TPL_IGNORE_FILES: {},
  },
});

export const NODE_ESLINT_TS_TEMPLATES = { eslintConfig };
