import { typescriptProvider } from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import { z } from 'zod';

const descriptorSchema = z.object({
  placeholder: z.string(),
});

export type AuthInfoProvider = unknown;

export const authInfoProvider =
  createProviderType<AuthInfoProvider>('auth-info');

const AuthInfoGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    typescript: typescriptProvider,
  },
  exports: {
    authInfo: authInfoProvider,
  },
  createGenerator(descriptor, { typescript }) {
    return {
      getProviders: () => ({
        authInfo: {},
      }),
      build: async (builder) => {},
    };
  },
});

export default AuthInfoGenerator;
