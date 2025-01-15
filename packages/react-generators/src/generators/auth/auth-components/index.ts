import type { ImportMapper } from '@halfdomelabs/core-generators';

import {
  makeImportAndFilePath,
  projectScope,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createProviderType } from '@halfdomelabs/sync';
import { z } from 'zod';

import { reactComponentsProvider } from '@src/generators/core/react-components/index.js';

import { authHooksProvider } from '../auth-hooks/index.js';

const descriptorSchema = z.object({
  loginPath: z.string().min(1),
});

export type AuthComponentsProvider = ImportMapper;

export const authComponentsProvider =
  createProviderType<AuthComponentsProvider>('auth-components');

export const authComponentsGenerator = createGenerator({
  name: 'auth/auth-components',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder, { loginPath }) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        authHooks: authHooksProvider,
        reactComponents: reactComponentsProvider,
        typescript: typescriptProvider,
      },
      exports: {
        authComponents: authComponentsProvider.export(projectScope),
      },
      run({ authHooks, reactComponents, typescript }) {
        const [, requireAuthPath] = makeImportAndFilePath(
          `${reactComponents.getComponentsFolder()}/RequireAuth/index.tsx`,
        );
        reactComponents.registerComponent({ name: 'RequireAuth' });

        return {
          providers: {
            authComponents: {
              getImportMap: () => ({
                '%auth-components': {
                  path: reactComponents.getComponentsImport(),
                  allowedImports: ['RequireAuth'],
                },
              }),
            },
          },
          build: async (builder) => {
            await builder.apply(
              typescript.createCopyAction({
                source: 'RequireAuth.tsx',
                destination: requireAuthPath,
                importMappers: [authHooks],
                replacements: {
                  LOGIN_PATH: loginPath,
                },
              }),
            );
          },
        };
      },
    });
  },
});
