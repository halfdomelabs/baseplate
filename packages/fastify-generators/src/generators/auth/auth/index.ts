import type { ImportEntry, ImportMapper } from '@halfdomelabs/core-generators';
import type { NonOverwriteableMap } from '@halfdomelabs/sync';

import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

const descriptorSchema = z.object({});

export interface AuthGeneratorConfig {
  userModelName?: string;
  authRolesImport?: ImportEntry;
  userSessionServiceImport?: ImportEntry;
  contextUtilsImport?: ImportEntry;
}

export interface AuthSetupProvider {
  getConfig(): NonOverwriteableMap<AuthGeneratorConfig>;
}

export const authSetupProvider =
  createProviderType<AuthSetupProvider>('auth-setup');

export interface AuthProvider extends ImportMapper {
  getConfig(): AuthGeneratorConfig;
}

export const authProvider = createProviderType<AuthProvider>('auth', {
  isReadOnly: true,
});

const AuthGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder) {
    const setupTask = taskBuilder.addTask({
      name: 'setup',
      exports: {
        authSetup: authSetupProvider,
      },
      run() {
        const config = createNonOverwriteableMap<AuthGeneratorConfig>(
          {},
          { name: 'auth-config' },
        );
        return {
          getProviders: () => ({
            authSetup: {
              getConfig: () => config,
            },
          }),
          build: () => ({ config }),
        };
      },
    });

    taskBuilder.addTask({
      name: 'main',
      exports: {
        auth: authProvider,
      },
      taskDependencies: { setupTask },
      run(deps, { setupTask: { config } }) {
        if (!config.value().authRolesImport) {
          throw new Error(
            'authRolesImport is required for auth module to work',
          );
        }
        if (!config.value().userSessionServiceImport) {
          throw new Error(
            'userSessionServiceImport is required for auth module to work',
          );
        }
        if (!config.value().contextUtilsImport) {
          throw new Error(
            'contextUtilsImport is required for auth module to work',
          );
        }
        return {
          getProviders: () => ({
            auth: {
              getConfig: () => config.value(),
              getImportMap() {
                const settings = config.value();
                return {
                  '%auth/auth-roles': settings.authRolesImport,
                  '%auth/user-session-service':
                    settings.userSessionServiceImport,
                  '%auth/context-utils': settings.contextUtilsImport,
                };
              },
            },
          }),
        };
      },
    });
  },
});

export default AuthGenerator;
