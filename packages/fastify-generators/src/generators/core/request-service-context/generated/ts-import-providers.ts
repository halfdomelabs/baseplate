import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  projectScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { CORE_REQUEST_SERVICE_CONTEXT_PATHS } from './template-paths.js';

const requestServiceContextImportsSchema = createTsImportMapSchema({
  createContextFromRequest: {},
  RequestServiceContext: { isTypeOnly: true },
});

export type RequestServiceContextImportsProvider =
  TsImportMapProviderFromSchema<typeof requestServiceContextImportsSchema>;

export const requestServiceContextImportsProvider =
  createReadOnlyProviderType<RequestServiceContextImportsProvider>(
    'request-service-context-imports',
  );

const coreRequestServiceContextImportsTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REQUEST_SERVICE_CONTEXT_PATHS.provider,
  },
  exports: {
    requestServiceContextImports:
      requestServiceContextImportsProvider.export(projectScope),
  },
  run({ paths }) {
    return {
      providers: {
        requestServiceContextImports: createTsImportMap(
          requestServiceContextImportsSchema,
          {
            createContextFromRequest: paths.requestServiceContext,
            RequestServiceContext: paths.requestServiceContext,
          },
        ),
      },
    };
  },
});

export const CORE_REQUEST_SERVICE_CONTEXT_IMPORTS = {
  task: coreRequestServiceContextImportsTask,
};
