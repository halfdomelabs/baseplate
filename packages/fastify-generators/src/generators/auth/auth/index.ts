import { ImportEntry, ImportMapper } from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  NonOverwriteableMap,
  createNonOverwriteableMap,
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

export const authProvider = createProviderType<AuthProvider>('auth');

const AuthGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {},
  exports: {
    authSetup: authSetupProvider,
    auth: authProvider.export().dependsOn(authSetupProvider),
  },
  createGenerator() {
    const config = createNonOverwriteableMap<AuthGeneratorConfig>(
      {},
      { name: 'auth-config' }
    );
    return {
      getProviders: () => ({
        authSetup: {
          getConfig: () => config,
        },
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
      build: async () => {},
    };
  },
});

export default AuthGenerator;
