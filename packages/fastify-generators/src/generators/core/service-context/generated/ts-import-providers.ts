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

export const serviceContextImportsSchema = createTsImportMapSchema({
  createServiceContext: {},
  createSystemServiceContext: {},
  createTestServiceContext: {},
  ExecutionContext: { isTypeOnly: true },
  ServiceContext: { isTypeOnly: true },
  ServiceContextWith: { isTypeOnly: true },
  withScriptContext: {},
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
          createSystemServiceContext: paths.serviceContext,
          createTestServiceContext: paths.testHelper,
          ExecutionContext: paths.serviceContext,
          ServiceContext: paths.serviceContext,
          ServiceContextWith: paths.serviceContext,
          withScriptContext: paths.serviceContext,
        }),
      },
    };
  },
});

export const CORE_SERVICE_CONTEXT_IMPORTS = {
  task: coreServiceContextImportsTask,
};
