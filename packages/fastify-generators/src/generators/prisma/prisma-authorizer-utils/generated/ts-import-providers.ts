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

import {
  authorizerUtilsImportsProvider,
  authorizerUtilsImportsSchema,
} from '#src/generators/prisma/_providers/authorizer-utils-imports.js';

import { PRISMA_PRISMA_AUTHORIZER_UTILS_PATHS } from './template-paths.js';

export const prismaAuthorizerUtilsImportsSchema = createTsImportMapSchema({
  createModelAuthorizer: {},
  ModelAuthorizer: { isTypeOnly: true },
  ModelAuthorizerConfig: { isTypeOnly: true },
});

export type PrismaAuthorizerUtilsImportsProvider =
  TsImportMapProviderFromSchema<typeof prismaAuthorizerUtilsImportsSchema>;

export const prismaAuthorizerUtilsImportsProvider =
  createReadOnlyProviderType<PrismaAuthorizerUtilsImportsProvider>(
    'prisma-authorizer-utils-imports',
  );

const prismaPrismaAuthorizerUtilsImportsTask = createGeneratorTask({
  dependencies: {
    paths: PRISMA_PRISMA_AUTHORIZER_UTILS_PATHS.provider,
  },
  exports: {
    authorizerUtilsImports: authorizerUtilsImportsProvider.export(packageScope),
    prismaAuthorizerUtilsImports:
      prismaAuthorizerUtilsImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        authorizerUtilsImports: createTsImportMap(
          authorizerUtilsImportsSchema,
          {
            checkGlobalAuthorization: paths.utilsAuthorizers,
            checkInstanceAuthorization: paths.utilsAuthorizers,
            GlobalRoleCheck: paths.utilsAuthorizers,
            InstanceRoleCheck: paths.utilsAuthorizers,
          },
        ),
        prismaAuthorizerUtilsImports: createTsImportMap(
          prismaAuthorizerUtilsImportsSchema,
          {
            createModelAuthorizer: paths.utilsAuthorizers,
            ModelAuthorizer: paths.utilsAuthorizers,
            ModelAuthorizerConfig: paths.utilsAuthorizers,
          },
        ),
      },
    };
  },
});

export const PRISMA_PRISMA_AUTHORIZER_UTILS_IMPORTS = {
  task: prismaPrismaAuthorizerUtilsImportsTask,
};
