import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import * as yup from 'yup';

/**
 * User Model requires the following fields:
 * + tokensNotBefore: (DateTime, nullable)
 */

const descriptorSchema = yup.object({
  userModelName: yup.string().required(),
});

export type AuthModuleProvider = unknown;

export const authModuleProvider =
  createProviderType<AuthModuleProvider>('auth-module');

const AuthModuleGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: (descriptor) => ({
    service: {
      defaultDescriptor: {
        generator: '@baseplate/fastify/auth/auth-service',
        userModelName: descriptor.userModelName,
        peerProvider: true,
      },
    },
    authMutations: {
      defaultDescriptor: {
        generator: '@baseplate/fastify/auth/auth-mutations',
      },
    },
    authPlugin: {
      defaultDescriptor: {
        generator: '@baseplate/fastify/auth/auth-plugin',
        userModelName: descriptor.userModelName,
      },
    },
  }),
  dependencies: {},
  exports: {
    authModule: authModuleProvider,
  },
  createGenerator() {
    return {
      getProviders: () => ({
        authModule: {},
      }),
      build: async () => {},
    };
  },
});

export default AuthModuleGenerator;
