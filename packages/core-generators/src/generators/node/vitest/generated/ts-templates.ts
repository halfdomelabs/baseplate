import { createTsTemplateFile } from '@src/renderers/typescript/index.js';

const globalSetup = createTsTemplateFile({
  name: 'global-setup',
  projectExports: {},
  source: { path: 'global-setup.ts' },
  variables: { TPL_OPERATIONS: {} },
});

const vitestConfig = createTsTemplateFile({
  name: 'vitest-config',
  projectExports: {},
  source: { path: 'vitest.config.ts' },
  variables: { TPL_CONFIG: {} },
});

export const NODE_VITEST_TS_TEMPLATES = { globalSetup, vitestConfig };
