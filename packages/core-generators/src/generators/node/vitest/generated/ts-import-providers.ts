import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import type { TsImportMapProviderFromSchema } from '#src/renderers/typescript/index.js';

import { packageScope } from '#src/providers/index.js';
import {
  createTsImportMap,
  createTsImportMapSchema,
} from '#src/renderers/typescript/index.js';

import { NODE_VITEST_PATHS } from './template-paths.js';

export const vitestImportsSchema = createTsImportMapSchema({
  createMockLogger: {},
  expectLogged: {},
  expectNotLogged: {},
  getLogCallCount: {},
  getLogCalls: {},
  MockLogger: { isTypeOnly: true },
  resetMockLogger: {},
});

export type VitestImportsProvider = TsImportMapProviderFromSchema<
  typeof vitestImportsSchema
>;

export const vitestImportsProvider =
  createReadOnlyProviderType<VitestImportsProvider>('vitest-imports');

const nodeVitestImportsTask = createGeneratorTask({
  dependencies: {
    paths: NODE_VITEST_PATHS.provider,
  },
  exports: { vitestImports: vitestImportsProvider.export(packageScope) },
  run({ paths }) {
    return {
      providers: {
        vitestImports: createTsImportMap(vitestImportsSchema, {
          createMockLogger: paths.loggerTestHelper,
          expectLogged: paths.loggerTestHelper,
          expectNotLogged: paths.loggerTestHelper,
          getLogCallCount: paths.loggerTestHelper,
          getLogCalls: paths.loggerTestHelper,
          MockLogger: paths.loggerTestHelper,
          resetMockLogger: paths.loggerTestHelper,
        }),
      },
    };
  },
});

export const NODE_VITEST_IMPORTS = {
  task: nodeVitestImportsTask,
};
