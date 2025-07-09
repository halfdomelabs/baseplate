import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  userSessionServiceImportsProvider,
  userSessionServiceImportsSchema,
} from '@baseplate-dev/fastify-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { AUTH_CORE_AUTH_MODULE_PATHS } from './template-paths.js';

const authModuleImportsSchema = createTsImportMapSchema({
  userSessionPayload: {},
});

export type AuthModuleImportsProvider = TsImportMapProviderFromSchema<
  typeof authModuleImportsSchema
>;

export const authModuleImportsProvider =
  createReadOnlyProviderType<AuthModuleImportsProvider>('auth-module-imports');

const authCoreAuthModuleImportsTask = createGeneratorTask({
  dependencies: {
    paths: AUTH_CORE_AUTH_MODULE_PATHS.provider,
  },
  exports: {
    authModuleImports: authModuleImportsProvider.export(packageScope),
    userSessionServiceImports:
      userSessionServiceImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        authModuleImports: createTsImportMap(authModuleImportsSchema, {
          userSessionPayload: paths.schemaUserSessionPayloadObjectType,
        }),
        userSessionServiceImports: createTsImportMap(
          userSessionServiceImportsSchema,
          { userSessionService: paths.userSessionService },
        ),
      },
    };
  },
});

export const AUTH_CORE_AUTH_MODULE_IMPORTS = {
  task: authCoreAuthModuleImportsTask,
};
