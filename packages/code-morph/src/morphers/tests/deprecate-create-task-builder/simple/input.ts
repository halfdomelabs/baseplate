// @ts-nocheck

import type { ImportMapper } from '@baseplate-dev/core-generators';

import {
  makeImportAndFilePath,
  projectScope,
  typescriptProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createProviderType,
  createTaskConfigBuilder,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { appModuleProvider } from '#src/generators/core/root-module/index.js';

import { authContextProvider } from '../auth-context/index.js';

const descriptorSchema = z.object({});

export type UserSessionTypesProvider = ImportMapper;

export const userSessionTypesProvider =
  createProviderType<UserSessionTypesProvider>('user-session-types');

const createMainTask = createTaskConfigBuilder(() => ({
  name: 'main',
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
}));

export const userSessionTypesGenerator = createGenerator({
  name: 'auth/user-session-types',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});
