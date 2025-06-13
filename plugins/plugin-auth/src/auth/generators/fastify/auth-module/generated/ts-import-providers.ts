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

import { FASTIFY_AUTH_MODULE_PATHS } from './template-paths.js';

const authModuleImportsSchema = createTsImportMapSchema({
  userSessionService: {},
});

export type AuthModuleImportsProvider = TsImportMapProviderFromSchema<
  typeof authModuleImportsSchema
>;

export const authModuleImportsProvider =
  createReadOnlyProviderType<AuthModuleImportsProvider>('auth-module-imports');

const fastifyAuthModuleImportsTask = createGeneratorTask({
  dependencies: {
    paths: FASTIFY_AUTH_MODULE_PATHS.provider,
  },
  exports: {
    authModuleImports: authModuleImportsProvider.export(projectScope),
  },
  run({ paths }) {
    return {
      providers: {
        authModuleImports: createTsImportMap(authModuleImportsSchema, {
          userSessionService: paths.userSessionService,
        }),
      },
    };
  },
});

export const FASTIFY_AUTH_MODULE_IMPORTS = {
  task: fastifyAuthModuleImportsTask,
};
