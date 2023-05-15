import {
  createProviderType,
  createGeneratorWithChildren,
} from '@halfdomelabs/sync';
import { z } from 'zod';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export type AuthPagesProvider = unknown;

export const authPagesProvider =
  createProviderType<AuthPagesProvider>('auth-pages');

const AuthPagesGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({
    layout: {
      defaultDescriptor: {
        name: 'AuthLayout',
        generator: '@halfdomelabs/react/auth/auth-layout',
      },
    },
    login: {
      defaultDescriptor: {
        name: 'Login',
        generator: '@halfdomelabs/react/auth/auth-login-page',
      },
    },
  }),
  dependencies: {},
  exports: {
    authPages: authPagesProvider,
  },
  createGenerator() {
    return {
      getProviders: () => ({
        authPages: {},
      }),
      build: async () => {},
    };
  },
});

export default AuthPagesGenerator;
