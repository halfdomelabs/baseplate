import type { ImportMapper } from '@halfdomelabs/core-generators';

import {
  makeImportAndFilePath,
  projectScope,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { appModuleProvider } from '@src/generators/core/app-module/app-module.generator.js';

import { authContextProvider } from '../auth-context/auth-context.generator.js';

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
        typescript: typescriptProvider,
        authContext: authContextProvider,
      },
      exports: {
        userSessionTypes: userSessionTypesProvider.export(projectScope),
      },
      run({ appModule, typescript, authContext }) {
        const [typesImport, typesFile] = makeImportAndFilePath(
          appModule.getModuleFolder(),
          'types/user-session.types.ts',
        );
        return {
          providers: {
            userSessionTypes: {
              getImportMap: () => ({
                '%user-session-types': {
                  path: typesImport,
                  allowedImports: [
                    'InvalidSessionError',
                    'UserSessionPayload',
                    'UserSessionService',
                  ],
                },
              }),
            },
          },
          build: async (builder) => {
            await builder.apply(
              typescript.createCopyAction({
                source: 'types/user-session.types.ts',
                destination: typesFile,
                importMappers: [authContext],
              }),
            );
          },
        };
      },
    }),
  }),
});
