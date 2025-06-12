import path from 'node:path';

import { createTsTemplateFile } from '#src/renderers/typescript/templates/types.js';

const globalSetup = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'global-setup',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/tests/scripts/global-setup.ts',
    ),
  },
  variables: { TPL_OPERATIONS: {} },
});

const vitestConfig = createTsTemplateFile({
  fileOptions: {
    kind: 'singleton',
    generatorTemplatePath: 'vitest.config.ts',
    pathRootRelativePath: '{package-root}/vitest.config.ts',
  },
  importMapProviders: {},
  name: 'vitest-config',
  source: {
    path: path.join(import.meta.dirname, '../templates/vitest.config.ts'),
  },
  variables: { TPL_CONFIG: {} },
});

export const NODE_VITEST_TEMPLATES = { globalSetup, vitestConfig };
