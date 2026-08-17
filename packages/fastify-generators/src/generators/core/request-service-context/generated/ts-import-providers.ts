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

import { CORE_REQUEST_SERVICE_CONTEXT_PATHS } from './template-paths.js';

export const requestServiceContextImportsSchema = createTsImportMapSchema({
  createContextFromRequest: {},
  RequestServiceContext: { isTypeOnly: true },
  RequestServiceContextWith: { isTypeOnly: true },
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
      requestServiceContextImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        requestServiceContextImports: createTsImportMap(
          requestServiceContextImportsSchema,
          {
            createContextFromRequest: paths.requestServiceContext,
            RequestServiceContext: paths.requestServiceContext,
            RequestServiceContextWith: paths.requestServiceContext,
          },
        ),
      },
    };
  },
});

export const CORE_REQUEST_SERVICE_CONTEXT_IMPORTS = {
  generatorName:
    '@baseplate-dev/fastify-generators#core/request-service-context',
  task: coreRequestServiceContextImportsTask,
};
