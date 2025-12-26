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

import { PRISMA_AUTHORIZER_UTILS_PATHS } from './template-paths.js';

export const authorizerUtilsImportsSchema = createTsImportMapSchema({
  checkGlobalAuthorization: {},
  checkInstanceAuthorization: {},
  createModelAuthorizer: {},
  InstanceRoleCheck: { isTypeOnly: true },
  ModelAuthorizer: { isTypeOnly: true },
  ModelAuthorizerConfig: { isTypeOnly: true },
});

export type AuthorizerUtilsImportsProvider = TsImportMapProviderFromSchema<
  typeof authorizerUtilsImportsSchema
>;

export const authorizerUtilsImportsProvider =
  createReadOnlyProviderType<AuthorizerUtilsImportsProvider>(
    'authorizer-utils-imports',
  );

const prismaAuthorizerUtilsImportsTask = createGeneratorTask({
  dependencies: {
    paths: PRISMA_AUTHORIZER_UTILS_PATHS.provider,
  },
  exports: {
    authorizerUtilsImports: authorizerUtilsImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        authorizerUtilsImports: createTsImportMap(
          authorizerUtilsImportsSchema,
          {
            checkGlobalAuthorization: paths.utilsAuthorizers,
            checkInstanceAuthorization: paths.utilsAuthorizers,
            createModelAuthorizer: paths.utilsAuthorizers,
            InstanceRoleCheck: paths.utilsAuthorizers,
            ModelAuthorizer: paths.utilsAuthorizers,
            ModelAuthorizerConfig: paths.utilsAuthorizers,
          },
        ),
      },
    };
  },
});

export const PRISMA_AUTHORIZER_UTILS_IMPORTS = {
  task: prismaAuthorizerUtilsImportsTask,
};
