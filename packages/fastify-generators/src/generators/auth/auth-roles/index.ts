import type { ImportEntry, ImportMapper } from '@halfdomelabs/core-generators';

import {
  makeImportAndFilePath,
  projectScope,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createProviderType } from '@halfdomelabs/sync';
import path from 'node:path';
import { z } from 'zod';

import { appModuleProvider } from '@src/generators/core/root-module/index.js';

import { authSetupProvider } from '../auth/index.js';

const descriptorSchema = z.object({
  // Note: Public and user roles are automatically added
  roles: z.array(
    z.object({
      // must be kebab-case
      name: z
        .string()
        .min(1)
        .regex(/^[a-z]+(-[a-z]+)*$/),
      comment: z.string().min(1),
      builtIn: z.boolean(),
    }),
  ),
});

export type AuthRolesProvider = ImportMapper;

export const authRolesProvider =
  createProviderType<AuthRolesProvider>('auth-roles');

export const authRolesGenerator = createGenerator({
  name: 'auth/auth-roles',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder, { roles }) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        typescript: typescriptProvider,
        appModule: appModuleProvider,
        authSetup: authSetupProvider,
      },
      exports: {
        authRoles: authRolesProvider.export(projectScope),
      },
      run({ typescript, appModule, authSetup }) {
        if (
          !['public', 'user', 'system'].every((name) =>
            roles.some((r) => r.name === name),
          )
        ) {
          throw new Error('public, user, and system roles are required');
        }

        const [fileImport, filePath] = makeImportAndFilePath(
          path.join(
            appModule.getModuleFolder(),
            'constants/auth-roles.constants.ts',
          ),
        );

        const authRolesImport: ImportEntry = {
          path: fileImport,
          allowedImports: [
            'AUTH_ROLE_CONFIG',
            'AuthRole',
            'DEFAULT_PUBLIC_ROLES',
            'DEFAULT_USER_ROLES',
          ],
        };

        authSetup.getConfig().set('authRolesImport', authRolesImport);

        return {
          getProviders: () => ({
            authRoles: {
              getImportMap: () => ({
                '%auth-roles': authRolesImport,
              }),
            },
          }),
          build: async (builder) => {
            await builder.apply(
              typescript
                .createTemplate({
                  TPL_AUTH_ROLES: TypescriptCodeUtils.createExpression(
                    JSON.stringify(
                      Object.fromEntries(
                        roles.map((r) => [
                          r.name,
                          {
                            comment: r.comment,
                            builtIn: r.builtIn,
                          },
                        ]),
                      ),
                    ),
                  ),
                })
                .renderToAction('constants/auth-roles.constants.ts', filePath),
            );
          },
        };
      },
    });
  },
});
