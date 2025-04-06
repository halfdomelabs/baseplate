import {
  type ImportEntry,
  type ImportMapper,
  projectScope,
} from '@halfdomelabs/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

const descriptorSchema = z.object({});

const [setupTask, authConfigProvider, authSetupProvider] =
  createConfigProviderTask(
    (t) => ({
      userModelName: t.scalar<string>(),
      authRolesImport: t.scalar<ImportEntry>(),
      userSessionServiceImport: t.scalar<ImportEntry>(),
      contextUtilsImport: t.scalar<ImportEntry>(),
    }),
    {
      prefix: 'auth',
      configScope: projectScope,
      configValuesScope: projectScope,
    },
  );

export { authConfigProvider, authSetupProvider };

export type AuthProvider = ImportMapper;

export const authProvider = createProviderType<AuthProvider>('auth', {
  isReadOnly: true,
});

export const authGenerator = createGenerator({
  name: 'auth/auth',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    setup: createGeneratorTask(setupTask),
    main: createGeneratorTask({
      dependencies: { authSetup: authSetupProvider },
      exports: {
        auth: authProvider.export(projectScope),
      },
      run({
        authSetup: {
          authRolesImport,
          userSessionServiceImport,
          contextUtilsImport,
        },
      }) {
        if (!authRolesImport) {
          throw new Error(
            'authRolesImport is required for auth module to work',
          );
        }
        if (!userSessionServiceImport) {
          throw new Error(
            'userSessionServiceImport is required for auth module to work',
          );
        }
        if (!contextUtilsImport) {
          throw new Error(
            'contextUtilsImport is required for auth module to work',
          );
        }
        return {
          providers: {
            auth: {
              getImportMap() {
                return {
                  '%auth/auth-roles': authRolesImport,
                  '%auth/user-session-service': userSessionServiceImport,
                  '%auth/context-utils': contextUtilsImport,
                };
              },
            },
          },
        };
      },
    }),
  }),
});
