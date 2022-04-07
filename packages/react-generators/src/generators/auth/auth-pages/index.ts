import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import * as yup from 'yup';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
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
        generator: '@baseplate/react/auth/auth-layout',
      },
    },
    login: {
      defaultDescriptor: {
        name: 'Login',
        generator: '@baseplate/react/auth/auth-login-page',
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
