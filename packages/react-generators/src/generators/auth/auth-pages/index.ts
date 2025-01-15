import { projectScope } from '@halfdomelabs/core-generators';
import { createGenerator, createProviderType } from '@halfdomelabs/sync';
import { z } from 'zod';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export type AuthPagesProvider = unknown;

export const authPagesProvider =
  createProviderType<AuthPagesProvider>('auth-pages');

export const authPagesGenerator = createGenerator({
  name: 'auth/auth-pages',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  // TODO [2025-01-01]: Remove
  // getDefaultChildGenerators: () => ({
  //   layout: {
  //     defaultDescriptor: {
  //       name: 'AuthLayout',
  //       generator: '@halfdomelabs/react/auth/auth-layout',
  //     },
  //   },
  //   login: {
  //     defaultDescriptor: {
  //       name: 'Login',
  //       generator: '@halfdomelabs/react/auth/auth-login-page',
  //     },
  //   },
  // }),
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
