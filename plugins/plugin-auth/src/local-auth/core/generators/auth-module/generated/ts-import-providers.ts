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

import { LOCAL_AUTH_CORE_AUTH_MODULE_PATHS } from './template-paths.js';

export const authModuleImportsSchema = createTsImportMapSchema({
  cleanupAuthVerificationQueue: {},
  cleanupAuthVerificationWorker: {},
  cleanupExpiredAuthVerifications: {},
  consumeCodeVerification: {},
  CookieUserSessionService: {},
  createAuthVerification: {},
  createCodeVerification: {},
  userSessionPayload: {},
  validateAuthVerification: {},
  validateCodeVerification: {},
});

export type AuthModuleImportsProvider = TsImportMapProviderFromSchema<
  typeof authModuleImportsSchema
>;

export const authModuleImportsProvider =
  createReadOnlyProviderType<AuthModuleImportsProvider>('auth-module-imports');

const localAuthCoreAuthModuleImportsTask = createGeneratorTask({
  dependencies: {
    paths: LOCAL_AUTH_CORE_AUTH_MODULE_PATHS.provider,
  },
  exports: {
    authModuleImports: authModuleImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        authModuleImports: createTsImportMap(authModuleImportsSchema, {
          cleanupAuthVerificationQueue: paths.queuesCleanupAuthVerification,
          cleanupAuthVerificationWorker:
            paths.queuesCleanupAuthVerificationWorker,
          cleanupExpiredAuthVerifications: paths.servicesAuthVerification,
          consumeCodeVerification: paths.servicesCodeVerification,
          CookieUserSessionService: paths.userSessionService,
          createAuthVerification: paths.servicesAuthVerification,
          createCodeVerification: paths.servicesCodeVerification,
          userSessionPayload: paths.schemaUserSessionPayloadObjectType,
          validateAuthVerification: paths.servicesAuthVerification,
          validateCodeVerification: paths.servicesCodeVerification,
        }),
      },
    };
  },
});

export const LOCAL_AUTH_CORE_AUTH_MODULE_IMPORTS = {
  generatorName: '@baseplate-dev/plugin-auth#local-auth/core/auth-module',
  task: localAuthCoreAuthModuleImportsTask,
};
