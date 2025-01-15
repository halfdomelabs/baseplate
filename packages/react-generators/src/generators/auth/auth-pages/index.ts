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
