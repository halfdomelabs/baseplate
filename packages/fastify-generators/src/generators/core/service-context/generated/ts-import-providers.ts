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

import { CORE_SERVICE_CONTEXT_PATHS } from './template-paths.js';

const serviceContextImportsSchema = createTsImportMapSchema({
  createServiceContext: {},
  createTestServiceContext: {},
  ServiceContext: { isTypeOnly: true },
});

export type ServiceContextImportsProvider = TsImportMapProviderFromSchema<
  typeof serviceContextImportsSchema
>;

export const serviceContextImportsProvider =
  createReadOnlyProviderType<ServiceContextImportsProvider>(
    'service-context-imports',
  );

const coreServiceContextImportsTask = createGeneratorTask({
  dependencies: {
    paths: CORE_SERVICE_CONTEXT_PATHS.provider,
  },
  exports: {
    serviceContextImports: serviceContextImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        serviceContextImports: createTsImportMap(serviceContextImportsSchema, {
          createServiceContext: paths.serviceContext,
          createTestServiceContext: paths.testHelper,
          ServiceContext: paths.serviceContext,
        }),
      },
    };
  },
});

export const CORE_SERVICE_CONTEXT_IMPORTS = {
  task: coreServiceContextImportsTask,
};
