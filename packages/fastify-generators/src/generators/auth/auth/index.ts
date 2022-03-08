import {
  createProviderType,
  createGeneratorWithChildren,
  NonOverwriteableMap,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import * as yup from 'yup';

const descriptorSchema = yup.object({});

export interface AuthGeneratorConfig {
  setting?: string;
}

export interface AuthProvider {
  getConfig(): NonOverwriteableMap<AuthGeneratorConfig>;
}

export const authProvider = createProviderType<AuthProvider>('auth');

const AuthGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {},
  exports: {
    auth: authProvider,
  },
  createGenerator(descriptor, dependencies) {
    const config = createNonOverwriteableMap({}, { name: 'auth-config' });
    return {
      getProviders: () => ({
        auth: {
          getConfig: () => config,
        },
      }),
      build: async (builder) => {},
    };
  },
});

export default AuthGenerator;
