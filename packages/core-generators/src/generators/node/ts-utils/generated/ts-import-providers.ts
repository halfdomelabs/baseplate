import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import type { TsImportMapProviderFromSchema } from '#src/renderers/typescript/index.js';

import { projectScope } from '#src/providers/index.js';
import {
  createTsImportMap,
  createTsImportMapSchema,
} from '#src/renderers/typescript/index.js';

import { NODE_TS_UTILS_PATHS } from './template-paths.js';

const tsUtilsImportsSchema = createTsImportMapSchema({
  capitalizeString: {},
  NormalizeTypes: { isTypeOnly: true },
  notEmpty: {},
  restrictObjectNulls: {},
});

export type TsUtilsImportsProvider = TsImportMapProviderFromSchema<
  typeof tsUtilsImportsSchema
>;

export const tsUtilsImportsProvider =
  createReadOnlyProviderType<TsUtilsImportsProvider>('ts-utils-imports');

const nodeTsUtilsImportsTask = createGeneratorTask({
  dependencies: {
    paths: NODE_TS_UTILS_PATHS.provider,
  },
  exports: {
    imports: tsUtilsImportsProvider.export(projectScope),
  },
  run({ paths }) {
    return {
      providers: {
        imports: createTsImportMap(tsUtilsImportsSchema, {
          capitalizeString: paths.string,
          NormalizeTypes: paths.normalizeTypes,
          notEmpty: paths.arrays,
          restrictObjectNulls: paths.nulls,
        }),
      },
    };
  },
});

export const NODE_TS_UTILS_IMPORTS = {
  task: nodeTsUtilsImportsTask,
};
