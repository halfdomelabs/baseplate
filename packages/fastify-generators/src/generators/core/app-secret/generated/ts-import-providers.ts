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

import { CORE_APP_SECRET_PATHS } from './template-paths.js';

export const appSecretImportsSchema = createTsImportMapSchema({
  createSigner: {},
  deriveKey: {},
  SecretPolicy: { isTypeOnly: true },
  Signer: { isTypeOnly: true },
});

export type AppSecretImportsProvider = TsImportMapProviderFromSchema<
  typeof appSecretImportsSchema
>;

export const appSecretImportsProvider =
  createReadOnlyProviderType<AppSecretImportsProvider>('app-secret-imports');

const coreAppSecretImportsTask = createGeneratorTask({
  dependencies: {
    paths: CORE_APP_SECRET_PATHS.provider,
  },
  exports: { appSecretImports: appSecretImportsProvider.export(packageScope) },
  run({ paths }) {
    return {
      providers: {
        appSecretImports: createTsImportMap(appSecretImportsSchema, {
          createSigner: paths.appSecret,
          deriveKey: paths.appSecret,
          SecretPolicy: paths.appSecret,
          Signer: paths.appSecret,
        }),
      },
    };
  },
});

export const CORE_APP_SECRET_IMPORTS = {
  generatorName: '@baseplate-dev/fastify-generators#core/app-secret',
  task: coreAppSecretImportsTask,
};
