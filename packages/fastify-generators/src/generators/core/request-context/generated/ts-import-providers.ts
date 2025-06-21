import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { CORE_REQUEST_CONTEXT_PATHS } from './template-paths.js';

const requestContextImportsSchema = createTsImportMapSchema({
  RequestInfo: { isTypeOnly: true },
});

export type RequestContextImportsProvider = TsImportMapProviderFromSchema<
  typeof requestContextImportsSchema
>;

export const requestContextImportsProvider =
  createReadOnlyProviderType<RequestContextImportsProvider>(
    'request-context-imports',
  );

const coreRequestContextImportsTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REQUEST_CONTEXT_PATHS.provider,
  },
  exports: {
    requestContextImports: requestContextImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        requestContextImports: createTsImportMap(requestContextImportsSchema, {
          RequestInfo: paths.requestContext,
        }),
      },
    };
  },
});

export const CORE_REQUEST_CONTEXT_IMPORTS = {
  task: coreRequestContextImportsTask,
};
