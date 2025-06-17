import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { stringifyPrettyStable } from '@baseplate-dev/utils';
import { z } from 'zod';

import { AUTH_AUTH_ROLES_GENERATED } from './generated/index.js';

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
    paths: AUTH_AUTH_ROLES_GENERATED.paths.task,
    imports: AUTH_AUTH_ROLES_GENERATED.imports.task,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        paths: AUTH_AUTH_ROLES_GENERATED.paths.provider,
      },
      run({ typescriptFile, paths }) {
        if (
          !['public', 'user', 'system'].every((name) =>
            roles.some((r) => r.name === name),
          )
        ) {
          throw new Error('public, user, and system roles are required');
        }

        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: AUTH_AUTH_ROLES_GENERATED.templates.authRoles,
                destination: paths.authRoles,
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
