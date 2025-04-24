import type { ImportMapper } from '@halfdomelabs/core-generators';

import {
  projectScope,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import path from 'node:path';
import { z } from 'zod';

import { appModuleProvider } from '@src/generators/core/app-module/app-module.generator.js';

import { authContextImportsProvider } from '../auth-context/auth-context.generator.js';
import {
  createUserSessionTypesImports,
  userSessionTypesImportsProvider,
} from './generated/ts-import-maps.js';
import { AUTH_USER_SESSION_TYPES_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

export type UserSessionTypesProvider = ImportMapper;

export const userSessionTypesProvider =
  createProviderType<UserSessionTypesProvider>('user-session-types');

export const userSessionTypesGenerator = createGenerator({
  name: 'auth/user-session-types',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        appModule: appModuleProvider,
        typescriptFile: typescriptFileProvider,
        authContextImports: authContextImportsProvider,
      },
      exports: {
        userSessionTypes: userSessionTypesProvider.export(projectScope),
        userSessionTypesImports:
          userSessionTypesImportsProvider.export(projectScope),
      },
      run({ appModule, typescriptFile, authContextImports }) {
        const userSessionTypesFile = path.join(
          appModule.getModuleFolder(),
          'types/user-session.types.ts',
        );
        return {
          providers: {
            userSessionTypes: {
              getImportMap: () => ({
                '%user-session-types': {
                  path: userSessionTypesFile,
                  allowedImports: [
                    'InvalidSessionError',
                    'UserSessionPayload',
                    'UserSessionService',
                  ],
                },
              }),
            },
            userSessionTypesImports: createUserSessionTypesImports(
              path.dirname(userSessionTypesFile),
            ),
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: AUTH_USER_SESSION_TYPES_TS_TEMPLATES.userSessionTypes,
                destination: userSessionTypesFile,
                importMapProviders: {
                  authContextImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});

export { userSessionTypesImportsProvider } from './generated/ts-import-maps.js';
