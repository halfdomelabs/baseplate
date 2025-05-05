import {
  projectScope,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { stringifyPrettyStable } from '@halfdomelabs/utils';
import { posixJoin } from '@halfdomelabs/utils/node';
import path from 'node:path';
import { z } from 'zod';

import { appModuleProvider } from '@src/generators/core/app-module/app-module.generator.js';

import {
  authRolesImportsProvider,
  createAuthRolesImports,
} from './generated/ts-import-maps.js';
import { AUTH_AUTH_ROLES_TS_TEMPLATES } from './generated/ts-templates.js';

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

export const authRolesGenerator = createGenerator({
  name: 'auth/auth-roles',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ roles }) => ({
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        appModule: appModuleProvider,
      },
      exports: {
        authRolesImports: authRolesImportsProvider.export(projectScope),
      },
      run({ typescriptFile, appModule }) {
        if (
          !['public', 'user', 'system'].every((name) =>
            roles.some((r) => r.name === name),
          )
        ) {
          throw new Error('public, user, and system roles are required');
        }

        const filePath = posixJoin(
          appModule.getModuleFolder(),
          'constants/auth-roles.constants.ts',
        );

        return {
          providers: {
            authRolesImports: createAuthRolesImports(path.dirname(filePath)),
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: AUTH_AUTH_ROLES_TS_TEMPLATES.authRoles,
                destination: filePath,
                variables: {
                  TPL_AUTH_ROLES: stringifyPrettyStable(
                    Object.fromEntries(
                      roles.map((r) => [
                        r.name,
                        { comment: r.comment, builtIn: r.builtIn },
                      ]),
                    ),
                  ),
                },
              }),
            );
          },
        };
      },
    }),
  }),
});

export { authRolesImportsProvider } from './generated/ts-import-maps.js';
