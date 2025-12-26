import path from 'node:path';

import { createTsTemplateFile } from '#src/renderers/typescript/templates/types.js';

const loggerTestHelper = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'test-helpers',
  importMapProviders: {},
  name: 'logger-test-helper',
  projectExports: {
    createMockLogger: { isTypeOnly: false },
    expectLogged: { isTypeOnly: false },
    expectNotLogged: { isTypeOnly: false },
    getLogCallCount: { isTypeOnly: false },
    getLogCalls: { isTypeOnly: false },
    MockLogger: { isTypeOnly: true },
    resetMockLogger: { isTypeOnly: false },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/tests/helpers/logger.test-helper.ts',
    ),
  },
  variables: {},
});

export const testHelpersGroup = { loggerTestHelper };

const vitestConfig = createTsTemplateFile({
  fileOptions: {
    generatorTemplatePath: 'vitest.config.ts',
    kind: 'singleton',
    pathRootRelativePath: '{package-root}/vitest.config.ts',
  },
  importMapProviders: {},
  name: 'vitest-config',
  source: {
    path: path.join(import.meta.dirname, '../templates/vitest.config.ts'),
  },
  variables: { TPL_CONFIG: {} },
});

export const NODE_VITEST_TEMPLATES = { testHelpersGroup, vitestConfig };
