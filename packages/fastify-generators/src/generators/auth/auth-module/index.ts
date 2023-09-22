import {
  createProviderType,
  createGeneratorWithChildren,
} from '@halfdomelabs/sync';
import { z } from 'zod';

/**
 * User Model requires the following fields:
 * + tokensNotBefore: (DateTime, nullable)
 */

const descriptorSchema = z.object({
  userModelName: z.string().min(1),
});

export type AuthModuleProvider = unknown;

export const authModuleProvider =
  createProviderType<AuthModuleProvider>('auth-module');

const AuthModuleGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: (descriptor) => ({
    service: {
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/auth/auth-service',
        userModelName: descriptor.userModelName,
        peerProvider: true,
      },
    },
    authMutations: {
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/auth/auth-mutations',
      },
    },
    authPlugin: {
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/auth/auth-plugin',
        peerProvider: true,
      },
    },
    roleService: {},
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
    };
  },
});

export default AuthModuleGenerator;
