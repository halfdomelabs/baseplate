import { projectScope } from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export type AuthPagesProvider = unknown;

export const authPagesProvider =
  createProviderType<AuthPagesProvider>('auth-pages');

const AuthPagesGenerator = createGeneratorWithTasks({
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
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {},
      exports: {
        authPages: authPagesProvider.export(projectScope),
      },
      run() {
        return {
          getProviders: () => ({
            authPages: {},
          }),
        };
      },
    });
  },
});

export default AuthPagesGenerator;
