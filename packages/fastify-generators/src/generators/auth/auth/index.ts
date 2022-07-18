import { ImportEntry, ImportMapper } from '@baseplate/core-generators';
import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
  NonOverwriteableMap,
} from '@baseplate/sync';
import { z } from 'zod';

const descriptorSchema = z.object({});

export interface AuthGeneratorConfig {
  userModelName?: string;
  roleServiceImport?: ImportEntry;
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
          { name: 'auth-config' }
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
      dependsOn: setupTask,
      run() {
        const { config } = setupTask.getOutput();
        return {
          getProviders: () => ({
            auth: {
              getConfig: () => config.value(),
              getImportMap() {
                const { roleServiceImport } = config.value();
                return {
                  ...(roleServiceImport
                    ? { '%role-service': roleServiceImport }
                    : {}),
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
